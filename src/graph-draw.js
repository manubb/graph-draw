// Graph-draw
// version: 2.0.0
// author: Manuel Baclet <mbaclet@gmail.com>
// license: MIT

'use strict';

var tess = new (require('./tessellator'))();

/* Stack class with no duplicates */

function TaskList() {
	this.list = [];
	this.hash = Object.create(null);
}
TaskList.prototype.push = function(index) {
	if (this.hash[index]) return;
	this.hash[index] = true;
	this.list.push(index);
};
TaskList.prototype.pop = function() {
	if (this.list.length) {
		var value = this.list.pop();
		delete this.hash[value];
		return value;
	} else return null;
};

/* Union-find functions */

function unionFindUnion(obj1, obj2) {
	var root1 = unionFindFind(obj1);
	var root2 = unionFindFind(obj2);
	if (root1 !== root2) {
		if (root1.rank < root2.rank) {
			root1.parent = root2;
		} else {
			root2.parent = root1;
			if (root1.rank === root2.rank) root1.rank += 1;
		}
	}
}

function unionFindFind(x) {
	if (x.parent !== x) x.parent = unionFindFind(x.parent);
	return x.parent;
}

/* Fast collision test for rectangles*/

function subTest(p1, p2 , r) {
	var position;
	var norm = norm2(p1, p2);
	var product, localPosition;
	for (var i = 0; i < 4; i++) {
		product = innerProduct(p1, p2, p1, r[i]);
		if (product <= 0) localPosition = -1;
		else if (product >= norm) localPosition = 1;
		else return false;
		if (i === 0) {
			position = localPosition;
		} else {
			if (localPosition !== position) {
				return false;
			}
		}
	}
	return true;
}

function rectanglesCollide(r1, r2) {
	return !(subTest(r1[0], r1[1], r2) || subTest(r1[1], r1[2], r2) || subTest(r2[0], r2[1], r1) || subTest(r2[1], r2[2], r1));
}

/* Geometry helpers */

function innerProduct(p1, p2, p3, p4) {
	return (p2[0] - p1[0]) * (p4[0] - p3[0]) + (p2[1] - p1[1]) * (p4[1] - p3[1]);
}
function norm2(p1, p2) {
	var dx = p2[0] - p1[0];
	var dy = p2[1] - p1[1];
	return dx * dx + dy * dy;
}

function segmentIntersection(p1, p2, p3, p4) {
	// find intersection point of [p1, p2] and [p3, p4], supposing it exists
	var dx = p2[0] - p1[0];
	var dy = p2[1] - p1[1];
	var dx2 = p4[0] - p3[0];
	var dy2 = p4[1] - p3[1];
	var lambda = ((p2[0] - p3[0]) * dy - dx * (p2[1] - p3[1])) /
		(dx2 * dy - dx * dy2);
	return [p3[0] + lambda * dx2, p3[1] + lambda * dy2];
}
function rayIntersection(p1, p2, p3, p4) {
	// find intersection point of (p1, p2] and (p3, p4]
	var dx = p2[0] - p1[0];
	var dy = p2[1] - p1[1];
	var dx2 = p4[0] - p3[0];
	var dy2 = p4[1] - p3[1];
	var denom = dx2 * dy - dx * dy2;
	if (denom === 0) return {point: p1, valid: true};
	var lambda = ((p2[0] - p3[0]) * dy - dx * (p2[1] - p3[1])) / denom;
	var inter = [p3[0] + lambda * dx2, p3[1] + lambda * dy2];
	if (lambda > 1 || innerProduct(p2, inter, p2, p1) < 0) return {point: inter, valid: false};
	else return {point: inter, valid: true};
}

function getData(from, to, w) {
	var ux = to[0] - from[0];
	var uy = to[1] - from [1];
	var Nu = Math.sqrt(ux * ux + uy * uy);
	var theta = Math.acos(ux / Nu);
	if (uy < 0) theta *= -1;
	return {
		angle: theta,
		norm: Nu,
		dir: [ux, uy],
		ortho: [- w * uy / Nu, w * ux / Nu]
	};
}

/* main function */

function graphDraw(graph, width, cb, maxAngle) {
	var w = width / 2;
	maxAngle = Math.max(Math.PI, maxAngle || 2 * Math.PI);

	/* Data structures setup */

	var vertices = graph.vertices.map(function(coords) {
		return {
			coords: coords,
			neighList: []
		};
	});
	var edges = graph.edges.map(function(edge, index) {
		var from = edge[0];
		var to = edge[1];
		var vertexFrom = vertices[from];
		var vertexTo = vertices[to];
		var data = getData(vertexFrom.coords, vertexTo.coords, w);
		vertexFrom.neighList.push({
			to: to,
			angle: data.angle,
			dir: data.dir,
			ortho: data.ortho,
			index: index
		});
		vertexTo.neighList.push({
			to: from,
			angle: data.angle <= 0 ? data.angle + Math.PI : data.angle - Math.PI,
			dir: [-data.dir[0], -data.dir[1]],
			ortho: [-data.ortho[0], -data.ortho[1]],
			index: index
		});
		var obj = {
			rank: 0,
			edge: edge,
			points: {}
		};
		obj.points[to] = {};
		obj.points[from] = {};
		obj.parent = obj;
		return obj;
	});

	/* Build edges contour points */

	var toPostProcess = [];
	vertices.forEach(function(vertex, vindex) {
		var point = vertex.coords;
		var prepared = vertex.neighList;
		prepared.sort(function(a, b) {return a.angle - b.angle;});
		var n = prepared.length;
		if (n === 1) {
			var edge = prepared[0];
			var p1 = [point[0] + edge.ortho[0], point[1] + edge.ortho[1]];
			var p2 = [point[0] - edge.ortho[0], point[1] - edge.ortho[1]];
			var edgePoints = edges[edge.index].points;
			edgePoints[vindex].first_vertex = edge.index;
			edgePoints[vindex].last_vertex = edge.index;
			edgePoints[vindex].first = p1;
			edgePoints[vindex].remove_middle_first = true;
			edgePoints[vindex].remove_middle_last = true;
			edgePoints[vindex].last = p2;
		} else {
			prepared.forEach(function(edge, index) {
				var last = (index === n - 1);
				var next = prepared[last ? 0 : index + 1];
				var edgePoints = edges[edge.index].points;
				var nextPoints = edges[next.index].points;
				edgePoints[vindex].first_vertex = next.index;
				nextPoints[vindex].last_vertex = edge.index;
				var p1 = [point[0] + edge.ortho[0], point[1] + edge.ortho[1]];
				var p2 = [p1[0] + edge.dir[0], p1[1] + edge.dir[1]];
				var p3 = [point[0] - next.ortho[0], point[1] - next.ortho[1]];
				var p4 = [p3[0] + next.dir[0], p3[1] + next.dir[1]];
				var intersection = rayIntersection(p1, p2, p3, p4);
				var newPoint = intersection.point;
				if (intersection.valid) {
					var nextAngle = last ? next.angle + 2 * Math.PI : next.angle;
					if (nextAngle - edge.angle > maxAngle) {
						edgePoints[vindex].first = p1;
						nextPoints[vindex].last = p3;
						var vec = [newPoint[0] - point[0], newPoint[1] - point[1]];
						var invNorm = 1 / Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
						edgePoints[vindex].miter_first = nextPoints[vindex].miter_last = [
							point[0] + w * vec[0] * invNorm,
							point[1] + w * vec[1] * invNorm
						];
					} else {
						edgePoints[vindex].first = newPoint;
						nextPoints[vindex].last = newPoint;
					}
					if (n === 2) {
						edgePoints[vindex].remove_middle_first = true;
						nextPoints[vindex].remove_middle_last = true;
					}
				} else {
					var q1 = [newPoint[0] - edge.ortho[0], newPoint[1] - edge.ortho[1]];
					var q3 = [newPoint[0] + next.ortho[0], newPoint[1] + next.ortho[1]];

					toPostProcess.push({
						done: [edge.index, next.index],
						todo: [vindex, edge.to, next.to],
						rectangles: [[p1, newPoint, q1, point], [p3, newPoint, q3, point]]
					});

					edgePoints[vindex].first = p1;
					nextPoints[vindex].last = p3;
				}
			});
		}
	});

	/* Build each edge polygon */

	edges.forEach(function(obj) {
		var edge = obj.edge;
		var from = edge[0];
		var to = edge[1];
		var obj1 = obj.points[from];
		var obj2 = obj.points[to];
		var fromCoords = vertices[from].coords;
		var toCoords = vertices[to].coords;
		var newPoly = obj.polygon = [];

		if (innerProduct(obj1.last, obj2.first, fromCoords, toCoords) < 0) {
			var i1 = obj1.last_vertex;
			var i2 = obj2.first_vertex;
			unionFindUnion(edges[i1], edges[i2]);
			newPoly.push(segmentIntersection(obj1.miter_last || fromCoords, obj1.last, obj2.first, obj2.miter_first || toCoords));
		} else {
			newPoly.push(obj1.last, obj2.first);
		}
		if (obj2.miter_first) newPoly.push(obj2.miter_first);
		if (!(obj2.remove_middle_first && obj2.remove_middle_last)) newPoly.push(toCoords);
		if (obj2.miter_last) newPoly.push(obj2.miter_last);
		if (innerProduct(obj1.first, obj2.last, fromCoords, toCoords) < 0) {
			var i1 = obj1.first_vertex;
			var i2 = obj2.last_vertex;
			unionFindUnion(edges[i1], edges[i2]);
			newPoly.push(segmentIntersection(obj1.first, obj1.miter_first || fromCoords, obj2.miter_last || toCoords, obj2.last));
		} else {
			newPoly.push(obj2.last, obj1.first);
		}
		if (obj1.miter_first) newPoly.push(obj1.miter_first);
		if (!(obj1.remove_middle_first && obj1.remove_middle_last)) newPoly.push(fromCoords);
		if (obj1.miter_last) newPoly.push(obj1.miter_last);
	});

	/* Find locally overlapping edges */

	var shapeMemo = Object.create(null);

	toPostProcess.forEach(function(obj) {
		var done = Object.create(null);
		var i1 = obj.done[0];
		var i2 = obj.done[1];
		var e1 = edges[i1];
		var e2 = edges[i2];
		unionFindUnion(e1, e2);
		done[i1] = true;
		done[i2] = true;
		var todo = new TaskList();
		obj.todo.forEach(function(vertex) {
			todo.push(vertex);
		});
		var from;
		var r1 = obj.rectangles[0];
		var r2 = obj.rectangles[1];
		while((from = todo.pop()) !== null) {
			vertices[from].neighList.forEach(function(neigh) {
				var index = neigh.index;
				if (done[index]) return;
				var to = neigh.to;
				var rectangle = shapeMemo[index];
				if (!rectangle) {
					var fromCoords = vertices[from].coords;
					var toCoords = vertices[to].coords;
					var p1 = [fromCoords[0] + neigh.ortho[0], fromCoords[1] + neigh.ortho[1]];
					var p2 = [toCoords[0] + neigh.ortho[0], toCoords[1] + neigh.ortho[1]];
					var p3 = [toCoords[0] - neigh.ortho[0], toCoords[1] - neigh.ortho[1]];
					var p4 = [fromCoords[0] - neigh.ortho[0], fromCoords[1] - neigh.ortho[1]];
					rectangle = shapeMemo[index] = [p1, p2, p3, p4];
				}
				done[index] = true;
				if (rectanglesCollide(rectangle, r1) || rectanglesCollide(rectangle, r2)) {
					unionFindUnion(e1, edges[index]);
					todo.push(to);
				}
			});
		}
	});

	/* Execute cb on each polygon */

	var needUnion = [];
	edges.forEach(function(obj, index) {
		if (obj.rank > 0 && obj.parent === obj) {
			obj.union = obj.union || [];
			obj.union.push(obj.polygon);
			needUnion.push(index);
		} else {
			if (obj.parent === obj) {
				cb(obj.polygon);
			} else {
				var root = unionFindFind(obj);
				root.union = root.union || [];
				root.union.push(obj.polygon);
			}
		}
	});

	tess._cb = cb;
	needUnion.forEach(function(index) {
		tess.run(edges[index].union);
	});
	delete tess._cb;
}

module.exports = graphDraw;

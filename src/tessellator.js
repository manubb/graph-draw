// Graph-draw Tesselator
// author: Manuel Baclet <mbaclet@gmail.com>
// license: MIT

'use strict';

var tess;

try {
  tess = require('libtess');
} catch (e) {
	if (typeof window.libtess === 'undefined') {
			throw new Error('libtess must be loaded before graph-draw');
	}
  tess = window.libtess;
}

var GluTesselator = tess.GluTesselator, gluEnum = tess.gluEnum, primitiveType = tess.primitiveType;

var GLU_TESS_BOUNDARY_ONLY = gluEnum.GLU_TESS_BOUNDARY_ONLY;
var GL_LINE_LOOP = tess.primitiveType.GL_LINE_LOOP;

function Tesselator() {
	GluTesselator.call(this);

	this.gluTessNormal(0, 0, 1);
	this.gluTessProperty(gluEnum.GLU_TESS_WINDING_RULE, tess.windingRule.GLU_TESS_WINDING_POSITIVE);

	this.gluTessCallback(gluEnum.GLU_TESS_VERTEX_DATA, this._vertex);
	this.gluTessCallback(gluEnum.GLU_TESS_BEGIN, this._begin);
	this.gluTessCallback(gluEnum.GLU_TESS_END, this._end);
	this.gluTessCallback(gluEnum.GLU_TESS_ERROR, this._error);
	this.gluTessCallback(gluEnum.GLU_TESS_COMBINE, this._combine);
}

Tesselator.prototype = Object.create(GluTesselator.prototype);
Tesselator.prototype.constructor = Tesselator;

Tesselator.prototype.run = function(polygons) {
	var self = this;
	this.gluTessBeginPolygon();
	polygons.forEach(function(poly) {
		self.gluTessBeginContour();
		poly.forEach(function(point) {
			self.gluTessVertex([point[0], point[1], 0], point);
		});
		self.gluTessEndContour();
	});
	this.gluTessProperty(GLU_TESS_BOUNDARY_ONLY, true);
	this._output = [];
	this.gluTessEndPolygon();

	this.gluTessBeginPolygon();
	this._output.forEach(function(poly) {
		self.gluTessBeginContour();
		poly.forEach(function(point) {
			self.gluTessVertex([point[0], point[1], 0], point);
		});
		self.gluTessEndContour();
	});
	this.gluTessProperty(GLU_TESS_BOUNDARY_ONLY, false);
	this.gluTessEndPolygon();
};

Tesselator.prototype.clean = function() {
	this._accu = [];
	this._output = [];
};

Tesselator.prototype._begin = function(type) {
	this._primitiveType = type;
	this._accu = [];
};

Tesselator.prototype._vertex = function(v) {
	this._accu.push(v);
};

Tesselator.prototype._error = function(err) {
	console.error('libtess error: ' + err);
};

Tesselator.prototype._combine = function(v) {
	return [v[0], v[1]];
};

Tesselator.prototype._end = function() {
	if (this._primitiveType === GL_LINE_LOOP) {
		this._output.push(this._accu);
	} else {
		for (var i = 0; i < this._accu.length; i += 3) {
			this._cb([this._accu[i], this._accu[i+1], this._accu[i+2]]);
		}
	}
};

module.exports = Tesselator;

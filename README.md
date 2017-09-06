graph-draw
==========

A JavaScript library for tessellating undirected planar graphs for Node and browsers.

[![screenshot](/docs/img/intro.png)](https://manubb.github.io/graph-draw/basic-demo.html)

The algorithm is designed to avoid local overdraw. A typical non local overdraw (expected) situation:
[![overdraw](/docs/img/overdraw.png)](https://manubb.github.io/graph-draw/overdraw.html)

The library can be used for example to draw boundaries or polylines on a [Leaflet](http://leafletjs.com) map using [leaflet-pixi-overlay](https://www.npmjs.com/package/leaflet-pixi-overlay) (see the demos).
## Demo

A very basic [demo](https://manubb.github.io/graph-draw/basic-demo.html).

A [polyline](https://manubb.github.io/graph-draw/polyline.html) on a map (173 edges tessellated in 335 triangles).

French [cities boundaries](https://manubb.github.io/graph-draw/city-mesh.html) (186722 edges tessellated in 585352 triangles).

## Installation
graph-draw is available as a npm package:
```
npm install graph-draw
```
In Node:
```js
var graphDraw = require('graph-draw');
```

In browsers, include one file from the dist directory. (Files with name that contains "bundle" include libtess.)

## Usage
```js
var vertices = [[0, 0], [100, 0], [100, 100], [0, 100]];
// coordinates of the vertices

var edges = [[0, 1], [1, 2], [2, 3], [3, 0], [1, 3]];
// each edge is specified with the indices of the linked vertices
// each edge must appear exactly once in the list
// ([0, 1] and [1, 0] are the same edge)

var graph = {vertices: vertices, edges: edges};
var strokeWidth = 10;
var polygons = [];

function polygonCallBack(convexPolygon) {
	polygons.push(convexPolygon);
}

graphDraw(graph, strokeWidth, polygonCallBack);
```
The `polygonCallBack` is executed on each polygon of the tessellation. Now, `polygons` contains a list of convex polygons (which can be easily converted into triangle strips or triangle fans):

```js
[
  [[x1, y1], [x2, y2], [x3, y3], [x4, y4]],
  [[a1, b1], [a2, b2], [a3, b3]],
  ...
]
```

Those convex polygons can have between 3 and 8 edges.

## Limiting miters
When the angle between two consecutive edges is close to 2&pi;, long miter situations occur. For example:

```js
var vertices = [
  [0, -200],
  [100 , -100],
  [30, -200]
];

var edges = [
  [0, 1],
  [1, 2]
];
var graph = {vertices: vertices, edges: edges};
var strokeWidth = 20;
graphDraw(graph, strokeWidth, polygonCallBack);
```
produces:
![miter](/docs/img/miter.png)

To avoid this, `graphDraw` function accepts a fourth (optional) `maxAngle` parameter which is an angle between &pi; and 2&pi;. If the angle between two consecutive edges is above `maxAngle`, the miter will be replaced by two triangles approximating a round join. For example:

```js
graphDraw(graph, strokeWidth, polygonCallBack, Math.PI);
```
will produce:
![round](/docs/img/round.png)

graph-draw
==========

A JavaScript library for tessellating undirected planar graphs for Node and browsers.

[![screenshot](/docs/img/intro.png)](https://manubb.github.io/graph-draw/basic-demo.html)

The algorithm is designed to avoid local overdraw. A typical non local overdraw (expected) situation:
 ![overdraw](/docs/img/overdraw.png)

The library can be used for example to draw boundaries or polylines on a map (see the demos).
## Demo

A very basic [demo](https://manubb.github.io/graph-draw/basic-demo.html).

A [polyline](https://manubb.github.io/graph-draw/polyline.html) on a map (173 edges tessellated in 333 triangles).

French [cities boundaries](https://manubb.github.io/graph-draw/city-mesh.html) (186721 edges tessellated in 577447 triangles).

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
// ([0, 1] and [1, 0] are the same edges)

var graph = {vertices: vertices, edges: edges};
var strokeWidth = 10;
var triangles = graphDraw(graph, strokeWidth);
```
A list of triangles is returned:
```js
[
  [ [ -5, -5 ], [ 87.92893218813452, 5 ], [ 5, 5 ] ],
  [ [ 87.92893218813452, 5 ], [ -5, -5 ], [ 105, -5 ] ],
  ...
]
```

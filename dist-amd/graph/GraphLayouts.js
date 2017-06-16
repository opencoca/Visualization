!function(t,e){"function"==typeof define&&define.amd?define(["d3","dagre"],e):t.graph_GraphLayouts=e(t.d3,t.dagre)}(this,function(t,e){function i(t,e,i,o){var n=this;this.pos={};var r=0;o=o||(i>e?e-r:i-r)/2;var h=t.nodeCount(),a=-Math.PI/2,s=2*Math.PI/h;t.eachNode(function(t,e){var i=e.getBBox(!0),r=Math.max(i.width,i.height);n.pos[t]={x:e.fixed?e.x:Math.cos(a)*(o-r),y:e.fixed?e.y:Math.sin(a)*(o-r),width:i.width,height:i.height},a+=s})}function o(t,e,i,o){var n=this;this.pos={},t.eachNode(function(t,e){n.pos[t]={x:e.x,y:e.y,width:e.width,height:e.height}})}function n(e,i,o,n){n=n||{};var r=this;if(this.pos={},this.vertices=[],this.vertexMap={},e.eachNode(function(t){var i=e.node(t),o=i.getBBox(!0),n={id:t,x:i.pos().x,y:i.pos().y,width:o.width,height:o.height,value:i};r.vertices.push(n),r.vertexMap[t]=n}),this.edges=[],e.eachEdge(function(t,e,i){r.edges.push({source:r.vertexMap[e],target:r.vertexMap[i]})}),this.force=t.layout.force().linkDistance(n.linkDistance).linkStrength(n.linkStrength).friction(n.friction).charge(function(t){var e=t.value.getBBox();return n.charge*Math.max(e.width,e.height)}).chargeDistance(n.chargeDistance).theta(n.theta).gravity(n.gravity).nodes(this.vertices).links(this.edges),n.oneShot){this.force.start();var h=e.nodeCount();h=Math.min(h*h,500);for(var a=0;h>a;++a)this.force.tick();this.force.stop()}}function r(t,i,o,n){var r=new e.graphlib.Graph({multigraph:!0,compound:!0}).setGraph(n).setDefaultNodeLabel(function(){return{}}).setDefaultEdgeLabel(function(){return{}});t.eachNode(function(e){var i=t.node(e),o=i.getBBox();r.setNode(e,{width:o.width,height:o.height})}),t.eachEdge(function(e,i,o){var n=t.edge(e);r.setEdge(i,o,{weight:n.weight()},n._id)}),t.eachNode(function(e){r.setParent(e,t.parent(e))}),this.dagreLayout=e.layout(r);var h=-r.graph().width/2,a=-r.graph().height/2;r.nodes().forEach(function(t){var e=r.node(t);e.x+=h,e.y+=a}),r.edges().forEach(function(t){for(var e=r.edge(t),i=0;i<e.points.length;++i)e.points[i].x+=h,e.points[i].y+=a}),this.digraph=r}i.prototype.nodePos=function(t){return this.pos[t]},i.prototype.edgePoints=function(t){return[]},o.prototype.nodePos=function(t){return this.pos[t]},o.prototype.edgePoints=function(t){return[]},n.prototype.nodePos=function(t){return this.vertexMap[t]},n.prototype.edgePoints=function(t){return[]},r.prototype.nodePos=function(t){return this.digraph.node(t)},r.prototype.edgePoints=function(t){return this.digraph.edge(t._sourceVertex.id(),t._targetVertex.id(),t._id).points};var h={None:o,Circle:i,ForceDirected:n,Hierarchy:r};return h});
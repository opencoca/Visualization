!function(t,e){"function"==typeof define&&define.amd?define(["d3","../common/HTMLWidget","./Cell","../common/Text","css!./Border"],e):t.layout_Border=e(t.d3,t.common_HTMLWidget,t.layout_Cell,t.common_Text)}(this,function(t,e,i,s){function o(){e.call(this),this._tag="div",this._colCount=0,this._rowCount=0,this._colSize=0,this._rowSize=0,this._shrinkWrapBoxes={},this.content([]),this.sectionTypes([])}return o.prototype=Object.create(e.prototype),o.prototype.constructor=o,o.prototype._class+=" layout_Border",o.prototype.publish("designMode",!1,"boolean","Design Mode",null,{tags:["Basic"]}),o.prototype.publish("content",[],"widgetArray","widgets",null,{tags:["Intermediate"]}),o.prototype.publish("gutter",0,"number","Gap Between Widgets",null,{tags:["Basic"]}),o.prototype.publish("topShrinkWrap",!1,"boolean","'Top' Cell shrinks to fit content",null,{tags:["Intermediate"]}),o.prototype.publish("leftShrinkWrap",!1,"boolean","'Left' Cell shrinks to fit content",null,{tags:["Intermediate"]}),o.prototype.publish("rightShrinkWrap",!1,"boolean","'Right' Cell shrinks to fit content",null,{tags:["Intermediate"]}),o.prototype.publish("bottomShrinkWrap",!1,"boolean","'Bottom' Cell shrinks to fit content",null,{tags:["Intermediate"]}),o.prototype.publish("topSize",0,"number","Height of the 'Top' Cell (px)",null,{tags:["Private"]}),o.prototype.publish("leftSize",0,"number","Width of the 'Left' Cell (px)",null,{tags:["Private"]}),o.prototype.publish("rightSize",0,"number","Width of the 'Right' Cell (px)",null,{tags:["Private"]}),o.prototype.publish("bottomSize",0,"number","Height of the 'Bottom' Cell (px)",null,{tags:["Private"]}),o.prototype.publish("topPercentage",20,"number","Percentage (of parent) Height of the 'Top' Cell",null,{tags:["Private"]}),o.prototype.publish("leftPercentage",20,"number","Percentage (of parent) Width of the 'Left' Cell",null,{tags:["Private"]}),o.prototype.publish("rightPercentage",20,"number","Percentage (of parent) Width of the 'Right' Cell",null,{tags:["Private"]}),o.prototype.publish("bottomPercentage",20,"number","Percentage (of parent) Height of the 'Bottom' Cell",null,{tags:["Private"]}),o.prototype.publish("surfacePadding",0,"number","Cell Padding (px)",null,{tags:["Intermediate"]}),o.prototype.publish("sectionTypes",[],"array","Section Types sharing an index with 'content' - Used to determine position/size.",null,{tags:["Private"]}),o.prototype.watchWidget=function(t){if(void 0===this._watch&&(this._watch={}),this._watch[t.id()]&&(this._watch[t.id()].remove(),delete this._watch[t.id()]),t){var e=this;this._watch[t.id()]=t.monitor(function(t,i,s){s!==i&&e.lazyPostUpdate()})}},o.prototype.lazyPostUpdate=o.prototype.debounce(function(){this.postUpdate()},100),o.prototype.applyLayoutType=function(){var t=this.borderLayoutObject();this.content().forEach(function(e,i){e._fixedLeft=t[this.sectionTypes()[i]].left,e._fixedTop=t[this.sectionTypes()[i]].top,e._fixedWidth=t[this.sectionTypes()[i]].width,e._fixedHeight=t[this.sectionTypes()[i]].height,e._dragHandles=this.cellSpecificDragHandles(this.sectionTypes()[i])},this)},o.prototype.cellSpecificDragHandles=function(t){switch(t){case"top":return["s"];case"right":return["w"];case"bottom":return["n"];case"left":return["e"];case"center":return[]}},o.prototype.borderLayoutObject=function(t){function e(t){t.width.px="undefined"!=typeof t.width.px?t.width.px:0,t.width["%"]="undefined"!=typeof t.width["%"]?t.width["%"]:0,t.height.px="undefined"!=typeof t.height.px?t.height.px:0,t.height["%"]="undefined"!=typeof t.height["%"]?t.height["%"]:0;var e={width:t.width.px+t.width["%"]/100*_.width(),height:t.height.px+t.height["%"]/100*_.height(),top:t.top.px+t.top["%"]/100*_.height()+_.gutter()/2,left:t.left.px+t.left["%"]/100*_.width()+_.gutter()/2};return e}var i,s,o,h,l,n,r,d,p,a,c,g,f,u={},_=this,y=this.target().getBoundingClientRect(),b={};return b.top=y.top,b.left=y.left,b.bottom=y.bottom,b.right=y.right,this.target()instanceof SVGElement?(b.width=parseFloat(this.target().getAttribute("width")),b.height=parseFloat(this.target().getAttribute("height"))):(b.width=y.width,b.height=y.height),-1!==this.sectionTypes().indexOf("top")&&(n=this.topSize(),r=this.topPercentage(),"undefined"!=typeof this._shrinkWrapBoxes.top&&(n=this._shrinkWrapBoxes.top.height+this.gutter(),r=0)),-1!==this.sectionTypes().indexOf("bottom")&&(d=this.bottomSize(),p=this.bottomPercentage(),"undefined"!=typeof this._shrinkWrapBoxes.bottom&&(d=this._shrinkWrapBoxes.bottom.height+this.gutter(),p=0)),-1!==this.sectionTypes().indexOf("left")&&(a=this.leftSize(),c=this.leftPercentage(),"undefined"!=typeof this._shrinkWrapBoxes.left&&(a=this._shrinkWrapBoxes.left.width+this.gutter(),c=0)),-1!==this.sectionTypes().indexOf("right")&&(g=this.rightSize(),f=this.rightPercentage(),"undefined"!=typeof this._shrinkWrapBoxes.right&&(g=this._shrinkWrapBoxes.right.width+this.gutter(),f=0)),i=e({width:{px:0,"%":100},height:{px:n,"%":r},top:{px:0,"%":0},left:{px:0,"%":0}}),s=e({width:{px:0,"%":100},height:{px:d,"%":p},top:{px:0,"%":100},left:{px:0,"%":0}}),s.top-=s.height,h=e({width:{px:a,"%":c},height:{px:-i.height-s.height,"%":100},top:{px:i.height,"%":0},left:{px:0,"%":0}}),o=e({width:{px:g,"%":f},height:{px:-i.height-s.height,"%":100},top:{px:i.height,"%":0},left:{px:0,"%":100}}),o.left-=o.width,l=e({width:{px:-o.width-h.width,"%":100},height:{px:-i.height-s.height,"%":100},top:{px:i.height,"%":0},left:{px:h.width,"%":0}}),u.top=i,u.bottom=s,u.right=o,u.left=h,u.center=l,u},o.prototype.clearContent=function(e){if(e){var i=this.sectionTypes().indexOf(e);i>=0&&(this._watch&&this.content()[i]&&delete this._watch[this.content()[i].id()],this.content()[i].target(null),t.select("#"+this.id()+" > div.borderHandle_"+e).classed("borderHandleDisabled",!0),this.content().splice(i,1),this.sectionTypes().splice(i,1))}else this.content().forEach(function(t){return t.target(null),!1}),t.select("#"+this.id()+" > div.borderHandle").classed("borderHandleDisabled",!0),delete this._watch,this.content([]),this.sectionTypes([])},o.prototype.hasContent=function(t,e,i){return this.sectionTypes().indexOf(t)>=0},o.prototype.setContent=function(t,e,s){if(this.clearContent(t),s="undefined"!=typeof s?s:"",e){var o=(new i).surfaceBorderWidth(0).widget(e).title(s);this.watchWidget(e),this.content().push(o),this.sectionTypes().push(t)}return this},o.prototype.getContent=function(t){var e=this.sectionTypes().indexOf(t);return e>=0?this.content()[e].widget():null},o.prototype.setLayoutOffsets=function(){this._offsetX=this._element.node().getBoundingClientRect().left+this.gutter()/2,this._offsetY=this._element.node().getBoundingClientRect().top+this.gutter()/2},o.prototype.dragStart=function(e){t.event.sourceEvent.stopPropagation();var i=this;this._dragCell=e,this._dragCellStartSize=this[e+"Size"](),this[e+"ShrinkWrap"]()&&(this[e+"Percentage"](0),this[e+"ShrinkWrap"](!1));var s=t.select("#"+i.id()+" > div.borderHandle_"+e);i._handleTop=parseFloat(s.style("top").split("px")[0]),i._handleLeft=parseFloat(s.style("left").split("px")[0]),this._dragPrevX=t.event.sourceEvent.clientX,this._dragPrevY=t.event.sourceEvent.clientY},o.prototype.dragTick=function(e){function i(e,i){if(0!==i){var o=t.selectAll("#"+s.id()+" > div.borderHandle"),h=t.select("#"+s.id()+" > div.borderHandle_"+e);h.classed("borderHandle_top")?(h.style({top:s._handleTop-i+"px"}),s._cellSizes.topHeight=s._handleTop-i,s._cellSizes.leftHeight=s._cellSizes.height,s._cellSizes.leftHeight-=s._cellSizes.topHeight,s._cellSizes.leftHeight-=s._cellSizes.bottomHeight,s._cellSizes.rightHeight=s._cellSizes.leftHeight):h.classed("borderHandle_right")?(h.style({left:s._handleLeft-i+"px"}),s._cellSizes.rightWidth=s._cellSizes.width-s._handleLeft+i):h.classed("borderHandle_bottom")?(h.style({top:s._handleTop-i+"px"}),s._cellSizes.bottomHeight=s._cellSizes.height-s._handleTop+i,s._cellSizes.leftHeight=s._cellSizes.height,s._cellSizes.leftHeight-=s._cellSizes.bottomHeight,s._cellSizes.leftHeight-=s._cellSizes.topHeight,s._cellSizes.rightHeight=s._cellSizes.leftHeight):h.classed("borderHandle_left")&&(h.style({left:s._handleLeft-i+"px"}),s._cellSizes.leftWidth=s._handleLeft-i),o.each(function(){var e=t.select(this);e.classed("borderHandle_top")?e.style({width:s._cellSizes.width+"px",top:s._cellSizes.topHeight-3+"px"}):e.classed("borderHandle_right")?e.style({left:s._cellSizes.width-s._cellSizes.rightWidth+"px",top:s._cellSizes.topHeight+3+"px",height:s._cellSizes.rightHeight+"px"}):e.classed("borderHandle_bottom")?e.style({width:s._cellSizes.width+"px",top:s._cellSizes.height-s._cellSizes.bottomHeight-3+"px"}):e.classed("borderHandle_left")&&e.style({left:s._cellSizes.leftWidth+"px",height:s._cellSizes.leftHeight+"px",top:s._cellSizes.topHeight+3+"px"})})}}var s=this,o=this._dragPrevX-t.event.sourceEvent.clientX,h=this._dragPrevY-t.event.sourceEvent.clientY;switch(e){case"top":case"bottom":i(e,h);break;case"right":case"left":i(e,o)}},o.prototype.dragEnd=function(e){if(e){var i=this._dragPrevX-t.event.sourceEvent.clientX,s=this._dragPrevY-t.event.sourceEvent.clientY;switch(e){case"top":0!==s&&(this.topPercentage(0),this.topSize(0===this.topSize()?this.getContent("top").getBBox().height-s:this.topSize()-s));break;case"right":0!==i&&(this.rightPercentage(0),this.rightSize(0===this.rightSize()?this.getContent("right").getBBox().width+i:this.rightSize()+i));break;case"bottom":0!==s&&(this.bottomPercentage(0),this.bottomSize(0===this.bottomSize()?this.getContent("bottom").getBBox().height+s:this.bottomSize()+s));break;case"left":0!==i&&(this.leftPercentage(0),this.leftSize(0===this.leftSize()?this.getContent("left").getBBox().width-i:this.leftSize()-i))}this._dragPrevX=t.event.sourceEvent.clientX,this._dragPrevY=t.event.sourceEvent.clientY}this.render()},o.prototype.size=function(t){var i=e.prototype.size.apply(this,arguments);return arguments.length&&this.contentDiv&&this.contentDiv.style("width",this._size.width+"px").style("height",this._size.height+"px"),i},o.prototype.enter=function(i,s){e.prototype.enter.apply(this,arguments);var o=this;s.style("position","relative"),this.contentDiv=s.append("div").classed("border-content",!0),this._scrollBarWidth=this.getScrollbarWidth(),this._borderHandles=["top","left","right","bottom"];var h=s.selectAll("div.borderHandle").data(this._borderHandles);h.enter().append("div").classed("borderHandle",!0).each(function(e){var i=t.select(this);i.classed("borderHandle_"+e,!0).classed("borderHandleDisabled",null===o.getContent(e))})},o.prototype.update=function(i,s){e.prototype.update.apply(this,arguments),this._sectionTypeArr=this.sectionTypes();var o=this;s.classed("design-mode",this.designMode()),this.setLayoutOffsets();var h=this.contentDiv.selectAll(".cell_"+this._id).data(this.content(),function(t){return t._id});h.enter().append("div").classed("cell_"+this._id,!0).style("position","absolute").each(function(e,i){t.select(this).classed("border-cell border-cell-"+o._sectionTypeArr[i],!0),e.target(this),t.select("#"+o.id()+" > div.borderHandle_"+o._sectionTypeArr[i]).classed("borderHandleDisabled",!1)}),h.each(function(t,e){var i=o.sectionTypes()[e];"undefined"!=typeof o[i+"ShrinkWrap"]&&o[i+"ShrinkWrap"]()?(t.render(),o._shrinkWrapBoxes[i]=t.widget().getBBox(!0)):delete o._shrinkWrapBoxes[i]});var l=t.behavior.drag().on("dragstart",function(t,e){o.dragStart.call(o,t,e)}).on("drag",function(t,e){o.dragTick.call(o,t,e)}).on("dragend",function(t,e){o.dragEnd.call(o,t,e)});this.designMode()?s.selectAll("#"+this.id()+" > div.borderHandle").call(l):s.selectAll("#"+this.id()+" > div.borderHandle").on(".drag",null);var n=this.borderLayoutObject();this.content().forEach(function(t,e){t._fixedLeft=n[this.sectionTypes()[e]].left,t._fixedTop=n[this.sectionTypes()[e]].top,t._fixedWidth=n[this.sectionTypes()[e]].width,t._fixedHeight=n[this.sectionTypes()[e]].height,t._dragHandles=[]},this),h.style("left",function(t){return t._fixedLeft+"px"}).style("top",function(t){return t._fixedTop+"px"}).style("width",function(t){return t._fixedWidth-o.gutter()+"px"}).style("height",function(t){return t._fixedHeight-o.gutter()+"px"}).each(function(t){t._parentElement.attr("draggable",o.designMode()).selectAll(".dragHandle").attr("draggable",o.designMode()),t.surfacePadding(o.surfacePadding()).resize()}),h.exit().each(function(t){t.target(null)}).remove(),this.getCellSizes(),s.selectAll("#"+this.id()+" > div.borderHandle").each(function(){var e=t.select(this);e.classed("borderHandle_top")?e.style({width:o._cellSizes.width+"px",top:o._cellSizes.topHeight-3+"px"}):e.classed("borderHandle_right")?e.style({left:o._cellSizes.width-o._cellSizes.rightWidth+"px",top:o._cellSizes.topHeight+3+"px",height:o._cellSizes.rightHeight+"px"}):e.classed("borderHandle_bottom")?e.style({width:o._cellSizes.width+"px",top:o._cellSizes.height-o._cellSizes.bottomHeight-3+"px"}):e.classed("borderHandle_left")&&e.style({left:o._cellSizes.leftWidth+"px",height:o._cellSizes.leftHeight+"px",top:o._cellSizes.topHeight+3+"px"})})},o.prototype.getCellSizes=function(){var e=this;e._cellSizes={};var i=this.element().node().getBoundingClientRect();e._cellSizes.width=i.width,e._cellSizes.height=i.height,this.element().selectAll("#"+this.id()+" > div > div.border-cell").each(function(){var i=t.select(this);if("function"==typeof i.node){var s=i.node().getBoundingClientRect();i.classed("border-cell-top")?e._cellSizes.topHeight=s.height:i.classed("border-cell-left")?(e._cellSizes.leftWidth=s.width,e._cellSizes.leftHeight=s.height):i.classed("border-cell-right")?(e._cellSizes.rightWidth=s.width,e._cellSizes.rightHeight=s.height):i.classed("border-cell-bottom")&&(e._cellSizes.bottomHeight=s.height)}});var s=["height","width","topHeight","bottomHeight","leftHeight","rightHeight","leftWidth","rightWidth"];s.forEach(function(t){e._cellSizes[t]=void 0===e._cellSizes[t]?0:e._cellSizes[t]})},o.prototype.postUpdate=function(t,e){var i=this;this.content().forEach(function(t){if(null!==t._element.node()){var e=t.widget().getBBox(),s=t.widget().getBBox(!0);(e.width!==s.width||e.height!==s.height)&&i.render()}})},o.prototype.exit=function(t,i){e.prototype.exit.apply(this,arguments)},o});
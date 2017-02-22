!function(t,a){"function"==typeof define&&define.amd?define(["d3","../common/HTMLWidget","../common/Utility","../api/INDChart"],a):t.chart_MultiChart=a(t.d3,t.common_HTMLWidget,t.common_Utility,t.api_INDChart)}(this,function(t,a,e,i){function r(){a.call(this),i.call(this),this._tag="div",this._allCharts={},this._allChartTypes.forEach(function(t){var a=JSON.parse(JSON.stringify(t));a.widget=null,this._allCharts[t.id]=a,this._allCharts[t.display]=a,this._allCharts[t.widgetClass]=a},this),this._chartTypeDefaults={},this._chartTypeProperties={}}return r.prototype=Object.create(a.prototype),r.prototype.constructor=r,r.prototype._class+=" chart_MultiChart",r.prototype["implements"](i.prototype),r.prototype._1DChartTypes=[{id:"C3_GAUGE",display:"Gauge (C3)",widgetClass:"c3chart_Gauge"}].map(function(t){return t.family="1D",t}),r.prototype._2DChartTypes=[{id:"SUMMARY",display:"Summary",widgetClass:"chart_Summary"},{id:"BUBBLE",display:"Bubble",widgetClass:"chart_Bubble"},{id:"PIE",display:"Pie",widgetClass:"chart_Pie"},{id:"GOOGLE_PIE",display:"Pie (Google)",widgetClass:"google_Pie"},{id:"C3_DONUT",display:"Donut (C3)",widgetClass:"c3chart_Donut"},{id:"C3_PIE",display:"Pie (C3)",widgetClass:"c3chart_Pie"},{id:"AM_FUNNEL",display:"Area (amCharts)",widgetClass:"amchart_Funnel"},{id:"AM_PIE",display:"Pie (amCharts)",widgetClass:"amchart_Pie"},{id:"AM_PYRAMID",display:"Area (amCharts)",widgetClass:"amchart_Pyramid"},{id:"WORD_CLOUD",display:"Word Cloud",widgetClass:"other_WordCloud"}].map(function(t){return t.family="2D",t}),r.prototype._NDChartTypes=[{id:"COLUMN",display:"Column",widgetClass:"chart_Column"},{id:"BAR",display:"Bar",widgetClass:"chart_Bar"},{id:"LINE",display:"Line",widgetClass:"chart_Line"},{id:"AREA",display:"Area",widgetClass:"chart_Area"},{id:"STEP",display:"Step",widgetClass:"chart_Step"},{id:"SCATTER",display:"Scatter",widgetClass:"chart_Scatter"},{id:"HEXBIN",display:"Hex Bin",widgetClass:"chart_HexBin"},{id:"GOOGLE_BAR",display:"Bar (Google)",widgetClass:"google_Bar"},{id:"GOOGLE_COLUMN",display:"Column (Google)",widgetClass:"google_Column"},{id:"GOOGLE_LINE",display:"Line (Google)",widgetClass:"google_Line"},{id:"GOOGLE_SCATTER",display:"Scatter (Google)",widgetClass:"google_Scatter"},{id:"GOOGLE_COMBO",display:"Combo (Google)",widgetClass:"google_Combo"},{id:"C3_AREA",display:"Area (C3)",widgetClass:"c3chart_Area"},{id:"C3_BAR",display:"Bar (C3)",widgetClass:"c3chart_Bar"},{id:"C3_COLUMN",display:"Column (C3)",widgetClass:"c3chart_Column"},{id:"C3_LINE",display:"Line (C3)",widgetClass:"c3chart_Line"},{id:"C3_SCATTER",display:"Scatter (C3)",widgetClass:"c3chart_Scatter"},{id:"C3_STEP",display:"Step (C3)",widgetClass:"c3chart_Step"},{id:"C3_COMBO",display:"Combo (C3)",widgetClass:"c3chart_Combo"},{id:"AM_AREA",display:"Area (amCharts)",widgetClass:"amchart_Area"},{id:"AM_BAR",display:"Bar (amCharts)",widgetClass:"amchart_Bar"},{id:"AM_LINE",display:"Line (amCharts)",widgetClass:"amchart_Line"},{id:"AM_SCATTER",display:"Scatter (amCharts)",widgetClass:"amchart_Scatter"},{id:"AM_COLUMN",display:"Column (amCharts)",widgetClass:"amchart_Column"},{id:"AM_GANTT",display:"Gantt (amCharts)",widgetClass:"amchart_Gantt"},{id:"AM_COMBO",display:"Combo (amCharts)",widgetClass:"amchart_Combo"}].map(function(t){return t.family="ND",t}),r.prototype._mapChartTypes=[{id:"CHORO_USSTATES",display:"US State Choropleth",widgetClass:"map_ChoroplethStates"},{id:"CHORO_USCOUNTIES",display:"US County Choropleth",widgetClass:"map_ChoroplethCounties"},{id:"CHORO_COUNTRIES",display:"Country Choropleth",widgetClass:"map_ChoroplethCountries"},{id:"GOOGLE_MAP",display:"Google Map",widgetClass:"map_GMapLayered"},{id:"OPENSTREET",display:"Open Street Map",widgetClass:"map_OpenStreet"}].map(function(t){return t.family="map",t}),r.prototype._anyChartTypes=[{id:"TABLE",display:"Table",widgetClass:"other_Table"},{id:"TABLE_NESTED",display:"Nested Table",widgetClass:"other_NestedTable"},{id:"TABLE_CALENDAR",display:"Table driven Calendar Heat Map",widgetClass:"other_CalendarHeatMap"},{id:"TABLE_BULLET",display:"Table driven bullet chart",widgetClass:"chart_Bullet"},{id:"TABLE_SELECT",display:"Table driven select",widgetClass:"other_Select"},{id:"TABLE_AUTOCOMPLETE",display:"Table driven auto complete",widgetClass:"other_AutoCompleteText"},{id:"TABLE_HANDSON",display:"Table driven handson",widgetClass:"handson_Table"},{id:"TABLE_OPPORTUNITY",display:"Table driven opportunity widget",widgetClass:"graph_Opportunity"},{id:"TABLE_TREE",display:"Table driven tree",widgetClass:"tree_Dendrogram"},{id:"TABLE_TREEMAP",display:"Table driven Treemap",widgetClass:"tree_Treemap"},{id:"TABLE_SANKEY",display:"Table driven Sankey",widgetClass:"graph_Sankey"},{id:"TABLE_GMAP_PIN",display:"Table driven Google Map (pins)",widgetClass:"map_GMapPin"},{id:"TABLE_GMAP_PINLINE",display:"Table driven Google Map (pins/lines)",widgetClass:"map_GMapPinLine"}].map(function(t){return t.family="any",t}),r.prototype._allChartTypes=r.prototype._1DChartTypes.concat(r.prototype._2DChartTypes.concat(r.prototype._NDChartTypes.concat(r.prototype._mapChartTypes.concat(r.prototype._anyChartTypes)))),r.prototype._allMap=t.map(r.prototype._allChartTypes,function(t){return t.family}),r.prototype._allFamilies=r.prototype._allMap.keys(),r.prototype._allChartTypesMap={},r.prototype._allChartTypesByClass={},r.prototype._allChartTypes.forEach(function(t){t.widgetPath=e.widgetPath(t.widgetClass),r.prototype._allChartTypesMap[t.id]=t,r.prototype._allChartTypesByClass[t.widgetClass]=t},this),r.prototype.publishReset(),r.prototype.publish("chartType","BUBBLE","set","Chart Type",r.prototype._allChartTypes.map(function(t){return t.id}),{tags:["Basic"]}),r.prototype.publish("chart",null,"widget","Chart",null,{tags:["Basic"]}),r.prototype.fields=function(t){var e=a.prototype.fields.apply(this,arguments);if(this.chart()){if(!arguments.length)return this.chart().fields();this.chart().fields(t)}return e},r.prototype.columns=function(t,e){var i=a.prototype.columns.apply(this,arguments);if(this.chart()){if(!arguments.length)return this.chart().columns();this.chart().columns(t,e)}return i},r.prototype.data=function(t){var e=a.prototype.data.apply(this,arguments);if(this.chart()){if(!arguments.length)return this.chart().data();this.chart().data(t)}return e},r.prototype._origChart=r.prototype.chart,r.prototype.chart=function(t){var a=r.prototype._origChart.apply(this,arguments);if(arguments.length){var e=this;t.click=function(t,a,i){e.click.apply(e,arguments)},t.dblclick=function(t,a,i){e.dblclick.apply(e,arguments)},this._chartMonitor&&(this._chartMonitor.remove(),delete this._chartMonitor),this._chartMonitor=t.monitor(function(a,i,r){e.broadcast(a,i,r,t)})}return a},r.prototype.hasOverlay=function(){return this.chart()&&this.chart().hasOverlay()},r.prototype.visible=function(t){return arguments.length?(this.chart()&&this.chart().visible(t),this):this.chart()&&this.chart().visible()},r.prototype.chartTypeDefaults=function(t){return arguments.length?(this._chartTypeDefaults=t,this):this._chartTypeDefaults},r.prototype.chartTypeProperties=function(t){return arguments.length?(this._chartTypeProperties=t,this):this._chartTypeProperties},r.prototype.getChartDataFamily=function(){return this._allCharts[this.chartType()].family},r.prototype.requireContent=function(t,a){e.requireWidget(this._allCharts[t].widgetClass).then(function(t){a(new t)})},r.prototype.switchChart=function(t){if(this._switchingTo===this.chartType())return void(t&&t(this));this._switchingTo&&console.log("Attempting switch to:  "+this.chartType()+", before previous switch is complete ("+this._switchingTo+")"),this._switchingTo=this.chartType();var a=this.chart(),e=this;this.requireContent(this.chartType(),function(i){if(i!==a){var r=e.size();i.fields(e.fields()).data(e.data()).size(r),e.chart(i),a&&a.data([]).size({width:1,height:1}).render()}delete e._switchingTo,t&&t(this)})},r.prototype.update=function(t,e){a.prototype.update.apply(this,arguments);var i=e.selectAll(".multiChart").data(this.chart()?[this.chart()]:[],function(t){return t._id});i.enter().append("div").attr("class","multiChart").each(function(t){t.target(this)});var r=this.chart();if(r){for(var s in this._chartTypeDefaults)if(r[s+"_default"])try{r[s+"_default"](this._chartTypeDefaults[s])}catch(l){console.log("Exception Setting Default:  "+s)}else console.log("Unknown Default:  "+s);this._chartTypeDefaults={};for(var o in this._chartTypeProperties)if(r[o])try{r[o](this._chartTypeProperties[o])}catch(l){console.log("Exception Setting Property:  "+o)}else console.log("Unknown Property:  "+o);this._chartTypeProperties={}}var p=this;i.each(function(t){t.resize(p.size())}),i.exit().transition().each(function(t){t.target(null)}).remove()},r.prototype.exit=function(t,e){this._chartMonitor&&(this._chartMonitor.remove(),delete this._chartMonitor),this.chart()&&this.chart().target(null),a.prototype.exit.apply(this,arguments)},r.prototype.render=function(t){if(this.chartType()&&(!this.chart()||this.chart().classID()!==this._allCharts[this.chartType()].widgetClass)){var e=this,i=arguments;return this.switchChart(function(){a.prototype.render.apply(e,i)}),this}return a.prototype.render.apply(this,arguments)},r});
!function(t,e){"function"==typeof define&&define.amd?define(["d3","../common/ResizeSurface","./MultiChart","../api/INDChart"],e):t.chart_MultiChartSurface=e(t.d3,t.common_ResizeSurface,t.chart_MultiChart,t.api_INDChart)}(this,function(t,e,n,o){function r(){e.call(this),o.call(this),this._title="MultiChartSurface",this._content=new n;var t=this;this._content.click=function(e,n){t.click(e,n)},this._menu.click=function(e){t._content.chartType(e).render()},this.content(this._content),this.mode("all")}return r.prototype=Object.create(e.prototype),r.prototype.constructor=r,r.prototype._class+=" chart_MultiChartSurface",r.prototype["implements"](o.prototype),r.prototype.publish("mode","2D","set","Chart Type",["1D","2D","ND","all"]),r.prototype.publishProxy("chartType","_content"),r.prototype.columns=function(t){return arguments.length?(this.content().columns(t),this):this.content().columns()},r.prototype.data=function(t){return arguments.length?(this.content().data(t),this):this.content().data()},r.prototype._origMode=r.prototype.mode,r.prototype.mode=function(t){var e=r.prototype._origMode.apply(this,arguments);if(arguments.length)switch(this._mode=t,this._mode){case"1d":case"1D":this.menu(this.content()._1DChartTypes.map(function(t){return t.display}).sort());break;case"2d":case"2D":this.menu(this.content()._2DChartTypes.concat(this.content()._NDChartTypes.concat(this.content()._anyChartTypes)).map(function(t){return t.display}).sort());break;case"multi":case"ND":this.menu(this.content()._NDChartTypes.concat(this.content()._anyChartTypes).map(function(t){return t.display}).sort());break;case"all":default:this.menu(this.content()._allChartTypes.map(function(t){return t.display}).sort())}return e},r});
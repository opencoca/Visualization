(function(e,t){typeof define=="function"&&define.amd?define(["d3","../common/ResizeSurface","./MultiChart","../api/INDChart"],t):e.chart_MultiChartSurface=t(e.d3,e.common_ResizeSurface,e.chart_MultiChart,e.api_INDChart)})(this,function(e,t,n,r){function i(){t.call(this),r.call(this),this._title="MultiChartSurface",this._content=new n,this._content.click=function(t,n){e.click(t,n)};var e=this;this._menu.click=function(t){e._content.chartType(t).render()},this.content(this._content),this.mode("all")}return i.prototype=Object.create(t.prototype),i.prototype.constructor=i,i.prototype._class+=" chart_MultiChartSurface",i.prototype.implements(r.prototype),i.prototype.testData=r.prototype.testData,i.prototype.publish("mode","2D","set","Chart Type",["1D","2D","ND","all"]),i.prototype.publishProxy("chartType","_content"),i.prototype.columns=function(e){return arguments.length?(this.content().columns(e),this):this.content().columns()},i.prototype.data=function(e){return arguments.length?(this.content().data(e),this):this.content().data()},i.prototype._modeOrig=i.prototype.mode,i.prototype.mode=function(e){var t=i.prototype._modeOrig.apply(this,arguments);if(arguments.length){this._mode=e;switch(this._mode){case"1d":case"1D":this.menu(this.content()._1DChartTypes.map(function(e){return e.display}).sort());break;case"2d":case"2D":this.menu(this.content()._2DChartTypes.concat(this.content()._NDChartTypes.concat(this.content()._anyChartTypes)).map(function(e){return e.display}).sort());break;case"multi":case"ND":this.menu(this.content()._NDChartTypes.concat(this.content()._anyChartTypes).map(function(e){return e.display}).sort());break;case"all":default:this.menu(this.content()._allChartTypes.map(function(e){return e.display}).sort())}}return t},i});
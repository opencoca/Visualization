!function(t,e){"function"==typeof define&&define.amd?define(["./Common","../api/I1DChart"],e):t.c3chart_Common1D=e(t.c3chart_Common,t.api_I1DChart)}(this,function(t,e){function o(o){t.call(this),e.call(this);var a=this;this._config.color={pattern:this._palette.colors()},this._config.data.colors=function(t,e){return a._palette(e.id?e.id:e)}}return o.prototype=Object.create(t.prototype),o.prototype.constructor=o,o.prototype._class+=" c3chart_Common1D",o.prototype["implements"](e.prototype),o.prototype.publish("paletteID","default","set","Palette ID",o.prototype._palette["switch"](),{tags:["Basic","Shared"]}),o.prototype.publish("useClonedPalette",!1,"boolean","Enable or disable using a cloned palette",null,{tags:["Intermediate","Shared"]}),o.prototype.update=function(e,o){this._palette=this._palette["switch"](this.paletteID()),this.useClonedPalette()&&(this._palette=this._palette.cloneNotExists(this.paletteID()+"_"+this.id())),t.prototype.update.apply(this,arguments)},o});
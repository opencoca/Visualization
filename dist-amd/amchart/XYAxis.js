!function(e,i){"function"==typeof define&&define.amd?define(["./SerialAxis"],i):e.amchart_XYAxis=i(e.amchart_SerialAxis)}(this,function(e){function i(){e.call(this)}return i.prototype=Object.create(e.prototype),i.prototype.constructor=i,i.prototype._class+=" amchart_XYAxis",i.prototype.publish("axisAutoGridCount",!0,"boolean","Specifies whether number of gridCount is specified automatically, acoarding to the axis size",null,{override:!0,tags:["Advanced"]}),i.prototype.publish("axisGridPosition","middle","set","Specifies if a grid line is placed on the center of a cell or on the beginning of a cell",["start","middle"],{override:!0,tags:["Advanced"]}),i.prototype.publish("axisTickFormat",null,"string","Y-Axis Tick Format",null,{override:!0,optional:!0}),i.prototype.publish("axisGridPosition","middle","set","Specifies if a grid line is placed on the center of a cell or on the beginning of a cell",["start","middle"],{override:!0,tags:["Advanced"]}),i.prototype.publish("axisGridAlpha",.2,"number","Grid alpha.",null,{override:!0,tags:["Intermediate"]}),i});
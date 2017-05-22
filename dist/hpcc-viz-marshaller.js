
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define('marshaller/FlyoutButton',["../form/Button", "../layout/Popup", "../layout/Surface"], factory);
    } else {
        root.marshaller_FlyoutButton = factory(root.form_Button, root.layout_Popup, root.layout_Surface);
    }
}(this, function (Button, Popup, Surface) {
    function FlyoutButton() {
        Button.call(this);

        this.value("^");

        var context = this;
        this._popupSurface = new Surface()
            .surfaceBackgroundColor("rgb(234, 249, 255)")
            .buttonAnnotations([
                {
                    id: "",
                    label: "\uf00d",
                    width: 20,
                    padding: "0px 5px",
                    class: "close",
                    font: "FontAwesome",
                }
            ])
            .on("click", function(ann) {
                if (ann.class === "close") {
                    context._popup
                        .visible(false)
                        .popupState(false)
                        .render()
                    ;
                }
            })
        ;
        this._popup = new Popup()
            .size({ width: 400, height: 400 })
            .position("absolute")
            .widget(this._popupSurface)
        ;
    }
    FlyoutButton.prototype = Object.create(Button.prototype);
    FlyoutButton.prototype.constructor = FlyoutButton;
    FlyoutButton.prototype._class += " marshaller_FlyoutButton";

    FlyoutButton.prototype.publishProxy("title", "_popupSurface");
    FlyoutButton.prototype.publishProxy("widget", "_popupSurface");
    FlyoutButton.prototype.publish("autoClose", true, "boolean", "Auto Close");

    FlyoutButton.prototype.reference = function (obj) {
        var retVal = new Button()
            .value(this.value())
        ;
        var context = this;
        retVal.click = function (obj) {
            context.click();
        };
        return retVal;
    };

    FlyoutButton.prototype.click = function (obj) {
        var context = this;
        this._popup
            .visible(true)
            .popupState(true)
            .render(function (w) {
                var bbox = context._popupSurface.widget().getBBox();
                context._popupSurface.resize({
                    width: bbox.width,
                    height: bbox.height + context._popupSurface.calcHeight(context._popupSurface.element().select(".surfaceTitle")) + 18
                });
                context._popup.render();
            })
        ;
    };

    FlyoutButton.prototype.enter = function (domNode, element) {
        Button.prototype.enter.apply(this, arguments);
        var parentWidget = this;
        while (parentWidget && ["marshaller_HTML", "marshaller_Graph", "composite_MegaChart"].indexOf(parentWidget.classID()) === -1) {
            parentWidget = parentWidget.locateParentWidget();
        }
        if (parentWidget) {
            this._popupParentWidget = parentWidget;
            this._popup
                .target(parentWidget.node())
            ;
        }
    };

    FlyoutButton.prototype.render = function (callback) {
        var context = this;
        var isVisible = this._popup.popupState();
        Button.prototype.render.call(context, function (widget) {
            var popupParentWidgetBBox = context._popupParentWidget.getBBox();
            var bbox = widget.getBBox();
            context._popup
                .left(bbox.x - popupParentWidgetBBox.x + bbox.width - context._popup.width())
                .top(bbox.y - popupParentWidgetBBox.y + bbox.height)
                .visible(isVisible && context.autoClose() ? false : isVisible)  //  hack:  closes the form when submit is clicked  ---
                .popupState(isVisible && context.autoClose() ? false : isVisible)
                .render()
            ;
            if (callback) {
                callback(widget);
            }
        });
    };

    return FlyoutButton;
}));


(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define('marshaller/HipieDDL.js',["d3", "../common/Class", "../common/Database", "../common/Utility", "../other/Comms", "../common/Widget", "../composite/MegaChart", "../chart/MultiChart", "../other/Table", "require", "es6-promise"], factory);
    } else {
        root.marshaller_HipieDDL = factory(root.d3, root.common_Class, root.common_Database, root.common_Utility, root.other_Comms, root.common_Widget, root.composite_MegaChart, root.chart_MultiChart, root.other_Table, root.require);
    }
}(this, function (d3, Class, Database, Utility, Comms, Widget, MegaChart, MultiChart, Table, require) {
    var LOADING = "...loading...";
    var _CHANGED = "_changed";

    function faCharFix(faChar) {
        if (faChar) {
            return String.fromCharCode(parseInt(faChar));
        }
        return faChar;
    }

    function hipieType2DBType(hipieType) {
        switch (hipieType) {
            case "bool":
            case "boolean":
                return "boolean";
            case "integer":
            case "float":
            case "double":
                return "number";
            case "date":
            case "time":
                return "time";
            case "geohash":
                return "geohash";
            case "dataset":
                return "dataset";
            case "visualization":
                return "widget";
            default:
                if (hipieType) {
                    if (hipieType.indexOf("unsigned") === 0) {
                        return "number";
                    } else if (hipieType.indexOf("integer") === 0) {
                        return "number";
                    } else if (hipieType.indexOf("real") === 0) {
                        return "number";
                    } else if (hipieType.indexOf("string") === 0) {
                        return "string";
                    }
                }
        }
        if (window.__hpcc_debug) {
            console.log("unknown hipieType:  " + hipieType);
        }
        return "string";
    }

    //  Mappings ---
    function SourceMappings(visualization, mappings) {
        this.visualization = visualization;
        var newMappings = {};
        for (var key in mappings) {
            if (mappings[key] instanceof Array) {
                mappings[key].forEach(function (mapingItem, idx) {
                    newMappings[idx === 0 ? key : key + "_" + idx] = mapingItem;
                });
            } else {
                newMappings[key] = mappings[key];
            }
        }
        this.mappings = newMappings;
        this.hasMappings = false;
        this.reverseMappings = {};
        this.columns = [];
        this.columnsIdx = {};
        this.columnsRHS = [];
        this.columnsRHSIdx = {};
    }

    SourceMappings.prototype.init = function() {
        for (var key in this.mappings) {
            this.reverseMappings[this.mappings[key]] = key;
            if (this.columnsIdx[key] === undefined) {
                this.columns.push(key);
                this.columnsIdx[key] = this.columns.length - 1;
            }
            this.columnsRHS[this.columnsIdx[key]] = this.mappings[key];
            this.columnsRHSIdx[this.mappings[key]] = this.columnsIdx[key];
            this.hasMappings = true;
        }
    };

    SourceMappings.prototype.init = function() {
        for (var key in this.mappings) {
            this.reverseMappings[this.mappings[key]] = key;
            if (this.columnsIdx[key] === undefined) {
                this.columns.push(key);
                this.columnsIdx[key] = this.columns.length - 1;
            }
            this.columnsRHS[this.columnsIdx[key]] = this.mappings[key];
            this.columnsRHSIdx[this.mappings[key]] = this.columnsIdx[key];
            this.hasMappings = true;
        }
    };

    SourceMappings.prototype.getFields = function () {
        if (this.visualization.fields()) {
            return Object.keys(this.mappings).map(function (key) {
                var field = this.visualization.field(key);
                if (!field) console.log("Unknown mapping field:  " + key);
                return new Database.Field(field.id())
                    .type(field.jsType())
                    .label(this.reverseMappings[field.id()])
                ;
            }, this);
        }
        return null;
    };

    SourceMappings.prototype.contains = function (key) {
        return this.mappings[key] !== undefined;
    };

    SourceMappings.prototype.doMap = function (item) {
        var retVal = [];
        for (var key in this.mappings) {
            var rhsKey = this.mappings[key];
            try {
                var val = item[rhsKey];
                if (val === undefined) {
                    val = item[rhsKey.toLowerCase()];
                }
                retVal[this.columnsIdx[key]] = val;
            } catch (e) {
                console.log("Invalid Mapping:  " + this.visualization.id + " [" + rhsKey + "->" + item + "]");
            }
        }
        return retVal;
    };

    SourceMappings.prototype.doReverseMap = function (item) {
        var retVal = {};
        for (var key in this.mappings) {
            var rhsKey = this.mappings[key];
            try {
                var val = item[key];
                if (val === undefined) {
                    val = item[key.toLowerCase()];
                }
                retVal[rhsKey] = val;
            } catch (e) {
                console.log("Invalid Mapping:  " + this.visualization.id + " [" + key + "->" + item + "]");
            }
        }
        return retVal;
    };

    SourceMappings.prototype.doMapAll = function (data) {
        return data.hipieMappings(this.columnsRHS.map(function (col) {
            return this.visualization.field(col);
        }, this), this.visualization.dashboard.marshaller.missingDataString());
    };

    SourceMappings.prototype.getMap = function (key) {
        return this.mappings[key];
    };

    SourceMappings.prototype.getReverseMap = function (key) {
        return this.reverseMappings[key];
    };

    function ChartMappings(visualization, mappings) {
        SourceMappings.call(this, visualization, mappings);
        this.columns = ["label", "weight"];
        this.columnsIdx = { label: 0, weight: 1 };
        this.init();
    }
    ChartMappings.prototype = Object.create(SourceMappings.prototype);

    function ChoroMappings(visualization, mappings) {
        SourceMappings.call(this, visualization, mappings);
        if (mappings.state) {
            this.columns = ["state", "weight"];
            this.columnsIdx = { state: 0, weight: 1 };
        } else if (mappings.county) {
            this.columns = ["county", "weight"];
            this.columnsIdx = { county: 0, weight: 1 };
        } else if (mappings.geohash) {
            this.columns = ["geohash", "weight"];
            this.columnsIdx = { geohash: 0, weight: 1 };
        }
        this.init();
    }
    ChoroMappings.prototype = Object.create(SourceMappings.prototype);

    function ChoroMappings2(visualization, mappings) {
        SourceMappings.call(this, visualization, mappings);
        if (mappings.state) {
            this.columns = ["state"];
            this.columnsIdx = { state: 0 };
        } else if (mappings.county) {
            this.columns = ["county"];
            this.columnsIdx = { county: 0};
        } else if (mappings.geohash) {
            this.columns = ["geohash", "label"];
            this.columnsIdx = { geohash: 0, label: 1 };
        }
        var weightOffset = this.columns.length;
        if (mappings.weight instanceof Array) {
          mappings.weight.forEach(function (w, i) {
              this.columns.push(w);
              this.columnsIdx[i === 0 ? "weight" : "weight_" + i] = i + weightOffset;
          }, this);
        }
        this.init();
    }
    ChoroMappings2.prototype = Object.create(SourceMappings.prototype);

    function HeatMapMappings(visualization, mappings) {
        SourceMappings.call(this, visualization, mappings);
        this.columns = ["x", "y", "weight"];
        this.columnsIdx = { x: 0, y: 1, weight: 2 };
        this.init();
    }
    HeatMapMappings.prototype = Object.create(SourceMappings.prototype);

    function LineMappings(visualization, mappings) {
        var newMappings = {
            label: mappings.x[0]
        };
        mappings.y.forEach(function(item, idx) {
            newMappings[item] = item;
        });
        SourceMappings.call(this, visualization, newMappings);
        this.init();
    }
    LineMappings.prototype = Object.create(SourceMappings.prototype);

    function TableMappings(visualization, mappings) {
        var newMappings = {};
        for (var key in mappings) {
            mappings[key].forEach(function (mapingItem, idx) {
                newMappings[visualization.label[idx]] = mapingItem;
            });
        }
        SourceMappings.call(this, visualization, newMappings);
        this.init();
    }
    TableMappings.prototype = Object.create(SourceMappings.prototype);

    TableMappings.prototype.init = function () {
        this.visualization.label.forEach(function (label, idx) {
            this.reverseMappings[this.mappings[label]] = label;
            this.columns.push(label);
            this.columnsIdx[label] = idx;
            this.columnsRHS[idx] = this.mappings[label];
            this.columnsRHSIdx[this.mappings[label]] = idx;
            this.hasMappings = true;
        }, this);
    };

    TableMappings.prototype.doMapAll = function (data) {
        var retVal = SourceMappings.prototype.doMapAll.apply(this, arguments);
        if (retVal instanceof Array) {
            var columnsRHSIdx = this.visualization.source.getColumnsRHSIdx();
            this.visualization.fields().forEach(function (field) {
                var fieldType = field.jsType();
                var colIdx = columnsRHSIdx[field.id()];
                if (colIdx === undefined) {
                    console.log("Invalid Mapping:  " + field.id());
                } else {
                    retVal = retVal.map(function (row) {
                        var cell = row[colIdx];
                        if (cell && cell.Row) {
                            cell = cell.Row;
                        }
                        if (cell instanceof Array) {
                            switch (fieldType) {
                                case "dataset":
                                    var columns = [];
                                    var columnsIdx = {};
                                    var data = cell.map(function (row, idx) {
                                        var retVal = [];
                                        retVal.length = columns.length;
                                        for (var key in row) {
                                            if (idx === 0) {
                                                columnsIdx[key] = columns.length;
                                                columns.push(key);
                                            }
                                            retVal[columnsIdx[key]] = row[key];
                                        }
                                        return retVal;
                                    });
                                    var table = new Table()
                                        .columns(columns)
                                        .data(data)
                                    ;
                                    row[colIdx] = table;
                                    break;
                                case "widget":
                                    var viz = this.visualization.vizDeclarations[field.localVisualizationID()];
                                    var output = viz.source.getOutput();
                                    var db = output.db;
                                    output.setData(cell, []);
                                    var widget = viz.widget;
                                    var newWidget = new widget.constructor()
                                        .showToolbar(false)
                                        .chartType(widget.chartType())
                                        .chartTypeDefaults(widget.chartTypeDefaults())
                                        .columns(viz.source.getColumns())
                                        .data(viz.source.getData())
                                    ;
                                    output.db = db;
                                    row[colIdx] = newWidget;
                                    break;
                            }
                        }
                        return row;
                    }, this);
                }
            }, this);
        }
        return retVal;
    };

    function GraphMappings(visualization, mappings, link) {
        SourceMappings.call(this, visualization, mappings);
        this.icon = visualization.icon || {};
        this.fields = visualization.fields();
        this.columns = ["uid", "label", "weight", "flags"];
        this.columnsIdx = { uid: 0, label: 1, weight: 2, flags: 3 };
        this.init();
        this.link = link;
        this.linkMappings = new SourceMappings(visualization, this.link.mappings);
        this.linkMappings.columns = ["uid"];
        this.linkMappings.columnsIdx = { uid: 0, label: 1 };
        this.visualization = visualization;
    }
    GraphMappings.prototype = Object.create(SourceMappings.prototype);

    GraphMappings.prototype.calcIconInfo = function (flag, origItem, forAnnotation) {
        var retVal = {};
        function mapStruct(struct, retVal) {
            if (struct) {
                for (var key in struct) {
                    switch (key) {
                        case "faChar":
                            retVal.faChar = faCharFix(struct.faChar);
                            break;
                        default:
                            if (forAnnotation && key.indexOf("icon_") === 0) { //  Backward compatability
                                console.log("Deprecated flag property:  " + key);
                                retVal[key.split("icon_")[1]] = struct[key];
                            }else{
                                retVal[key] = struct[key];
                            }
                    }
                }
            }
        }
        if (origItem && origItem[flag.fieldid] && flag.valuemappings) {
            var annotationInfo = flag.valuemappings[origItem[flag.fieldid]];
            mapStruct(annotationInfo, retVal);
        }

        for (var key in retVal) { // jshint ignore:line
            return retVal;
        }
        return null;
    };

    GraphMappings.prototype.doMapAll = function (db) {
        var data = db.jsonObj();
        var context = this;
        var vertexMap = {};
        var vertices = [];
        var megaChart = this.visualization.widget;
        var graph = megaChart.chart();
        function getVertex(item, origItem) {
            var id = "uid_" + item[0];
            var retVal = vertexMap[id];
            if (!retVal && origItem) {
                retVal = new graph.Vertex()
                    .faChar((context.icon && context.icon.faChar ? faCharFix(context.icon.faChar) : "\uf128"))
                    .text(item[1] ? item[1] : "")
                    .data(item)
                ;
                retVal.__hpcc_uid = item[0];
                vertexMap[id] = retVal;
                vertices.push(retVal);

                //  Icon  ---
                var iconInfo = context.calcIconInfo(context.visualization.icon, origItem, false);
                if (iconInfo) {
                    for (var key in iconInfo) {
                        if (retVal[key]) {
                            retVal[key](iconInfo[key]);
                        }
                    }
                }

                // Annotations  ---
                var annotations = [];
                context.visualization.flags.forEach(function (flag) {
                    var iconInfo = context.calcIconInfo(flag, origItem, true);
                    if (iconInfo) {
                        annotations.push(iconInfo);
                    }
                });
                retVal.annotationIcons(annotations);
            }
            return retVal;
        }
        var edges = [];
        data.forEach(function (item) {
            var mappedItem = context.doMap(item);
            getVertex(mappedItem, item);
        });
        data.forEach(function (item) {
            var mappedItem = context.doMap(item);
            var vertex = getVertex(mappedItem, item);
            if (item[context.link.childfile] && item[context.link.childfile] instanceof Array) {
                var childItems = item[context.link.childfile];
                childItems.forEach(function (childItem, i) {
                    var childMappedItem = context.linkMappings.doMap(childItem);
                    var childVertex = getVertex(childMappedItem);
                    if (childVertex && vertex.id() !== childVertex.id()) {
                        var edge = new graph.Edge()
                            .sourceVertex(vertex)
                            .targetVertex(childVertex)
                            .sourceMarker("circle")
                            .targetMarker("arrow")
                            .text(childMappedItem[1] ? childMappedItem[1] : "")
                            .data(childMappedItem)
                        ;
                        edges.push(edge);
                    }
                });
            }
        });
        return { vertices: vertices, edges: edges, merge: false };
    };

    //  Viz Source ---
    function Source(visualization, source) {
        this.visualization = visualization;
        if (source) {
            this._id = source.id;
            this._output = source.output;
            this.mappings = null;
            if (!source.mappings) {
                console.log("no mappings for:" + visualization.id + "->" + source.id);
            }
            switch (this.visualization.type) {
            case "LINE":
                this.mappings = new LineMappings(this.visualization, source.mappings);
                break;
            case "TABLE":
                this.mappings = new TableMappings(this.visualization, source.mappings);
                break;
            case "GRAPH":
                this.mappings = new GraphMappings(this.visualization, source.mappings, source.link);
                break;
            case "CHORO":
                if (source.mappings.weight instanceof Array && source.mappings.weight.length) {
                    this.mappings = new ChoroMappings2(this.visualization, source.mappings);
                    if (source.mappings.weight.length > 1) {
                        this.visualization.type = "LINE";
                    }
                } else {
                    this.mappings = new ChoroMappings(this.visualization, source.mappings);
                }
                break;
            case "HEAT_MAP":
                this.mappings = new HeatMapMappings(this.visualization, source.mappings);
                break;
            default:
                this.mappings = new ChartMappings(this.visualization, source.mappings);
                break;
            }
            this.first = source.first;
            this.reverse = source.reverse;
            this.sort = source.sort;
            this.properties = source.properties;
        }
    }

    Source.prototype.getQualifiedID = function () {
        return this.visualization.getQualifiedID() + "." + this._id;
    };

    Source.prototype.exists = function () {
        return this._id;
    };

    Source.prototype.getDatasource = function () {
        return this.visualization.dashboard.getDatasource(this._id);
    };

    Source.prototype.getOutput = function () {
        var datasource = this.getDatasource();
        if (datasource && datasource._outputs) {
            return datasource._outputs[this._output];
        }
        return null;
    };

    Source.prototype.hasData = function () {
        return this.getOutput().db ? true : false;
    };

    Source.prototype.getFields = function () {
        return this.mappings.getFields();
    };

    Source.prototype.getColumnsRHS = function () {
        return this.mappings.columnsRHS;
    };

    Source.prototype.getColumnsRHSIdx = function () {
        return this.mappings.columnsRHSIdx;
    };

    Source.prototype.getColumns = function () {
        return this.mappings && this.mappings.columns ? this.mappings.columns : [];
    };

    Source.prototype.getData = function () {
        var db = this.getOutput().db;
        var dataRef = db.data();
        if (dataRef.length && this.sort) {
            Utility.multiSort(dataRef, db.hipieMapSortArray(this.sort));
        }
        var retVal = this.mappings.doMapAll(db);
        if (this.reverse) {
            retVal.reverse();
        }
        if (this.first && retVal.length > this.first) {
            retVal.length = this.first;
        }
        return retVal;
    };

    Source.prototype.getXTitle = function () {
        return this.mappings.columns[0];
    };

    Source.prototype.getYTitle = function () {
        return this.mappings.columns.filter(function(d, i) {return i > 0;}).join(" / ");
    };

    Source.prototype.getMap = function (col) {
        return (this.mappings && this.mappings.hasMappings) ? this.mappings.getMap(col) : col;
    };

    Source.prototype.getReverseMap = function (col) {
        return (this.mappings && this.mappings.hasMappings) ? this.mappings.getReverseMap(col) : col;
    };

    //  Viz Events ---
    function EventUpdate(event, update, defMappings) {
        this.event = event;
        this.dashboard = event.visualization.dashboard;
        this._col = update.col;
        this._visualization = update.visualization;
        this._instance = update.instance;
        this._datasource = update.datasource;
        this._merge = update.merge;
        this._mappings = update.mappings || defMappings;
    }

    EventUpdate.prototype.getDatasource = function () {
        return this.dashboard.getDatasource(this._datasource);
    };

    EventUpdate.prototype.getVisualization = function () {
        return this.dashboard.getVisualization(this._visualization);
    };

    EventUpdate.prototype.mapData = function (row) {
        var retVal = {};
        if (row) {
            for (var key in this._mappings) {
                var origKey = this.getReverseMap(key);
                retVal[this._mappings[key]] = row[origKey];
            }
        }
        return retVal;
    };

    EventUpdate.prototype.getMap = function (col) {
        return this.event.visualization.source.getMap(col);
    };

    EventUpdate.prototype.getReverseMap = function (col) {
        return this.event.visualization.source.getReverseMap(col);
    };
    
    EventUpdate.prototype.mapSelected = function () {
        if (this.event.visualization.hasSelection()) {
            return this.mapData(this.event.visualization._widgetState.row);
        }
        return this.mapData({});
    };

    EventUpdate.prototype.calcRequestFor = function (visualization) {
        var retVal = {};
        var updateVisualization = this.getVisualization();
        updateVisualization.getInputVisualizations().forEach(function (inViz, idx) {
            //  Calc request for each visualization to be updated  ---
            var changed = inViz === visualization;
            inViz.getUpdatesForVisualization(updateVisualization).forEach(function (inVizUpdateObj) {
                //  Gather all contributing "input visualization events" for the visualization that is to be updated  ---
                var inVizRequest = inVizUpdateObj.mapSelected();
                for (var key in inVizRequest) {
                    if (retVal[key] && retVal[key] !== inVizRequest[key]) {
                        console.log("Duplicate Filter with mismatched value (defaulting to 'first' or 'first changed' instance):  " + key);
                        if (changed) {
                            retVal[key] = inVizRequest[key];
                            retVal[key + _CHANGED] = changed;
                        }
                    } else {
                        retVal[key] = inVizRequest[key];
                        retVal[key + _CHANGED] = changed;
                    }
                }
            });
        });
        return retVal;
    };

    function Event(visualization, eventID, event) {
        this.visualization = visualization;
        this.eventID = eventID;
        this._updates = [];
        this._mappings = event.mappings;
        if (event) {
            this._updates = event.updates.map(function (updateInfo) {
                return new EventUpdate(this, updateInfo, event.mappings);
            }, this);
        }
    }

    Event.prototype.exists = function () {
        return this._updates.length;
    };

    Event.prototype.getUpdates = function () {
        return this._updates.filter(function (updateInfo) {
            if (!updateInfo._col) return true;
            return updateInfo._col === updateInfo.getMap(this.visualization._widgetState.col);
        }, this);
    };

    Event.prototype.getUpdatesDatasources = function () {
        var dedup = {};
        var retVal = [];
        this.getUpdatesVisualizations().forEach(function (item, idx) {
            var datasource = item.source.getDatasource();
            if (datasource && !dedup[datasource.id]) {
                dedup[datasource.id] = true;
                retVal.push(datasource);
            }
        }, this);
        return retVal;
    };

    Event.prototype.getUpdatesVisualizations = function () {
        var dedup = {};
        var retVal = [];
        this._updates.forEach(function (updateObj, idx) {
            var visualization = updateObj.getVisualization();
            if (!dedup[visualization.id]) {
                dedup[visualization.id] = true;
                retVal.push(visualization);
            }
        }, this);
        return retVal;
    };
    
    Event.prototype.fetchData = function () {
        var fetchDataOptimizer = new VisualizationRequestOptimizer();
        this.getUpdates().forEach(function (updateObj) {
            fetchDataOptimizer.appendRequest(updateObj.getDatasource(), updateObj.calcRequestFor(this.visualization), updateObj.getVisualization());
        }, this);
        return fetchDataOptimizer.fetchData();
    };

    function Events(visualization, events) {
        this.visualization = visualization;
        this.events = {};
        for (var key in events) {
            this.events[key] = new Event(visualization, key, events[key]);
        }
    }

    Events.prototype.setWidget = function (widget) {
        var context = this;
        for (var key in this.events) {
            if (widget["vertex_" + key]) {
                widget["vertex_" + key] = function (row, col, selected) {
                    context.visualization.processEvent(key, context.events[key], row, col, selected);
                };
            } else if (widget[key]) {
                widget[key] = function (row, col, selected) {
                    context.visualization.processEvent(key, context.events[key], row, col, selected);
                };
            }
        }
    };

    Events.prototype.exists = function () {
        return this._updates !== undefined;
    };

    Events.prototype.getUpdates = function () {
        var retVal = [];
        for (var key in this.events) {
            retVal = retVal.concat(this.events[key].getUpdates());
        }
        return retVal;
    };

    Events.prototype.getUpdatesDatasources = function () {
        var retVal = [];
        for (var key in this.events) {
            retVal = retVal.concat(this.events[key].getUpdatesDatasources());
        }
        return retVal;
    };

    Events.prototype.getUpdatesVisualizations = function () {
        var retVal = [];
        for (var key in this.events) {
            retVal = retVal.concat(this.events[key].getUpdatesVisualizations());
        }
        return retVal;
    };

    //  Visualization Field---
    function Field(ddlField) {
        this._id = ddlField.id;
        this._label = ddlField.label;
        this._properties = ddlField.properties || {};
    }
    Field.prototype = Object.create(Class.prototype);
    Field.prototype.constructor = Field;

    Field.prototype.id = function () {
        return this._id;
    };

    Field.prototype.label= function () {
        return this._properties.label || this._label;
    };

    Field.prototype.type = function () {
        return this._properties.type || "";
    };

    Field.prototype.jsType = function () {
        return hipieType2DBType(this.type());
    };

    Field.prototype.charttype = function (_) {
        if (!arguments.length) return this._properties.charttype || "";
        this._properties.charttype = _;
        return this;
    };

    Field.prototype.localVisualizationID = function () {
        return this._properties.localVisualizationID || "";
    };

    Field.prototype.enumvals = function () {
        return this._properties.enumvals;    //  Return undefined if non existent
    };

    Field.prototype.hasDefault = function () {
        return this.default() !== undefined;
    };

    Field.prototype.default = function () {
        return this._properties.default || "";
    };

    Field.prototype.hasFunction = function () {
        return this.function() !== undefined;
    };

    Field.prototype.function = function () {
        return this._properties.function;
    };

    Field.prototype.params = function () {
        var retVal = [];
        var params = this._properties.params || {};
        for (var key in params) {
            retVal.push(params[key]);
        }
        return retVal;
    };

    Field.prototype.properties = function () {
        return this._properties;
    };

    //  Visualization ---
    function Visualization(dashboard, visualization, parentVisualization) {
        Class.call(this);

        this.dashboard = dashboard;
        this.parentVisualization = parentVisualization;
        this.type = visualization.type;
        this.id = visualization.id;

        switch (this.type) {
            case "TABLE":
                this.label = (visualization).label;
                break;
            case "GRAPH":
                this.label = (visualization).label;
                this.icon = (visualization).icon || { faChar: "\uf128" };
                this.flags = (visualization).flag || [];
                break;
        }
        this.title = visualization.title || visualization.id;
        this._fields = (visualization.fields || []).map(function (field) {
            return new Field(field);
        });
        this._fieldsMap = {};
        this._fields.forEach(function (field) {
            this._fieldsMap[field.id()] = field;
        }, this);

        this.properties = visualization.properties || (visualization.source ? visualization.source.properties : null) || {};
        this.source = new Source(this, visualization.source);
        this.events = new Events(this, visualization.events);
        this.layers = [];
        this.hasVizDeclarations = false;
        this.vizDeclarations = {};
        if (this.type === "CHORO") {
            this.layers = (visualization.visualizations || []).map(function (innerViz) { 
                return dashboard.createVisualization(innerViz, this); 
            }, this);
        } else {
            (visualization.visualizations || []).forEach(function (innerViz) {
                this.vizDeclarations[innerViz.id] = dashboard.createVisualization(innerViz, this);
                this.hasVizDeclarations = true;
            }, this);
        }
        var context = this;
        switch (this.type) {
            case "CHORO":
                var chartType = visualization.properties && visualization.properties.charttype ? visualization.properties.charttype : "";
                if (parentVisualization) {
                    switch (chartType) {
                        case "MAP_PINS":
                            this.loadWidget("../map/Pins", function (widget) {
                                try {
                                    widget
                                        .id(visualization.id)
                                        .columns(context.source.getColumns())
                                        .geohashColumn("geohash")
                                        .tooltipColumn("label")
                                        .fillColor(visualization.color ? visualization.color : null)
                                        .projection("albersUsaPr")
                                    ;
                                } catch (e) {
                                    console.log("Unexpected widget type:  " + widget.classID());
                                }
                            });
                            break;
                    }
                } else {
                    chartType = chartType || "CHORO";
                    if (chartType === "CHORO") {
                        if (this.source.mappings.contains("state")) {
                            chartType = "CHORO_USSTATES";
                        } else if (this.source.mappings.contains("county")) {
                            chartType = "CHORO_USCOUNTIES";
                        } else if (this.source.mappings.contains("country")) {
                            chartType = "CHORO_COUNTRIES";
                        }
                    }
                    Promise.all(context.layers.map(function (layer) { return layer.loadedPromise(); })).then(function () {
                        context.loadWidget("../composite/MegaChart", function (widget) {
                            var layers = context.layers.map(function (layer) { return layer.widget; });
                            try {
                                switch (widget.classID()) {
                                    case "composite_MegaChart":
                                        widget
                                            .id(visualization.id)
                                            .showChartSelect_default(false)
                                            .chartType_default(chartType)
                                            .chartTypeDefaults({
                                                autoScaleMode: layers.length ? "data" : "mesh"
                                            })
                                            .chartTypeProperties({
                                                layers: layers
                                            })
                                        ;
                                        break;
                                    default:
                                        widget
                                            .id(visualization.id)
                                            .autoScaleMode(layers.length ? "data" : "mesh")
                                            .layers(layers)
                                        ;
                                        break;
                                }
                            } catch (e) {
                                console.log("Unexpected widget type:  " + widget.classID());
                            }
                        });
                    });
                }
                break;
            case "2DCHART":
            case "PIE":
            case "BUBBLE":
            case "BAR":
            case "WORD_CLOUD":
                this.loadWidget("../composite/MegaChart", function (widget) {
                    try {
                        widget
                            .id(visualization.id)
                            .chartType_default(context.properties.chartType || context.properties.charttype || context.type)
                        ;
                    } catch (e) {
                        console.log("Unexpected widget type:  " + widget.classID());
                    }
                });
                break;
            case "LINE":
                this.loadWidget("../composite/MegaChart", function (widget) {
                    try {
                        widget
                            .id(visualization.id)
                            .chartType_default(context.properties.chartType || context.properties.charttype || context.type)
                        ;
                    } catch (e) {
                        console.log("Unexpected widget type:  " + widget.classID());
                    }
                });
                break;
            case "TABLE":
                this.loadWidget("../composite/MegaChart", function (widget) {
                    try {
                        widget
                            .id(visualization.id)
                            .showChartSelect_default(false)
                            .chartType_default("TABLE")
                        ;
                    } catch (e) {
                        console.log("Unexpected widget type:  " + widget.classID());
                    }
                });
                break;
            case "SLIDER":
                this.loadWidget("../form/Slider", function (widget) {
                    try {
                        widget
                            .id(visualization.id)
                        ;
                        if (visualization.range) {
                            var selectionLabel = "";
                            for (var key in visualization.source.mappings) {
                                selectionLabel = key;
                                break;
                            }
                            widget
                                .low_default(+visualization.range[0])
                                .high_default(+visualization.range[1])
                                .step_default(+visualization.range[2])
                                .selectionLabel_default(selectionLabel)
                            ;
                        }
                    } catch (e) {
                        console.log("Unexpected widget type:  " + widget.classID());
                    }
                });
                break;
            case "GRAPH":
                this.loadWidget("../composite/MegaChart", function (widget) {
                    try {
                        widget
                            .id(visualization.id)
                            .showChartSelect_default(false)
                            .chartType_default("GRAPH")
                            .chartTypeDefaults({
                                layout: "ForceDirected2",
                                applyScaleOnLayout: true
                            })
                        ;
                    } catch (e) {
                        console.log("Unexpected widget type:  " + widget.classID());
                    }
                });
                break;
            case "FORM":
                this.loadWidgets(["../form/Form", "../form/Input", "../form/Button", "../form/CheckBox", "../form/ColorInput", "../form/Radio", "../form/Range", "../form/Select", "../form/Slider", "../form/TextArea", "../form/InputRange"], function (widget, widgetClasses) {
                    var Input = widgetClasses[1];
                    var CheckBox = widgetClasses[3];
                    var Radio = widgetClasses[5];
                    var Select = widgetClasses[7];
                    var TextArea = widgetClasses[9];
                    var InputRange = widgetClasses[10];

                    try {
                        widget
                            .id(visualization.id)
                            .inputs(context.fields().map(function (field) {

                                var selectOptions = [];
                                var options = [];
                                var inp;
                                if (!field.charttype() && field.type() === "range") {
                                    //  TODO - Verify with @DL
                                    field.charttype("RANGE");
                                }
                                switch (field.charttype()) {
                                    case "TEXT":
                                        inp = new Input()
                                            .type_default("text")
                                        ;
                                        break;
                                    case "TEXTAREA":
                                        inp = new TextArea();
                                        break;
                                    case "CHECKBOX":
                                        inp = new CheckBox();
                                        break;
                                    case "RADIO":
                                        inp = new Radio();
                                        break;
                                    case "HIDDEN":
                                        inp = new Input()
                                            .type_default("hidden")
                                            ;
                                        break;
                                    case "RANGE":
                                        inp = new InputRange();
                                        break;
                                    default:
                                        if (field.enumvals()) {
                                            inp = new Select();
                                            options = field.enumvals();
                                            for (var val in options) {
                                                selectOptions.push([val, options[val]]);
                                            }
                                        } else {
                                            inp = new Input()
                                                .type_default("text")
                                            ;
                                        }
                                        break;
                                }

                                inp
                                    .name_default(field.id())
                                    .label_default(field.label())
                                    .value_default(field.default()) // TODO Hippie support for multiple default values (checkbox only)
                                ;

                                if (inp instanceof CheckBox || inp instanceof Radio) { // change this to instanceof?
                                    var vals = Object.keys(field.enumvals());
                                    inp.selectOptions_default(vals);
                                } else if (selectOptions.length) {
                                    inp.selectOptions_default(selectOptions);
                                }

                                return inp;
                            }))
                        ;
                    } catch (e) {
                        console.log("Unexpected widget type:  " + widget.classID());
                    }
                });
                break;
            case "HEAT_MAP":
                this.loadWidgets(["../other/HeatMap"], function (widget) {
                    try {
                        widget
                            .id(visualization.id)
                            .image_default(context.properties.imageUrl)
                        ;
                    } catch (e) {
                        console.log("Unexpected widget type:  " + widget.classID());
                    }
                });
                break;
            default:
                this.loadWidget("../common/TextBox", function (widget) {
                    try {
                        widget
                            .id(visualization.id)
                            .text_default(context.id + "\n" + "TODO:  " + context.type)
                        ;
                    } catch (e) {
                        console.log("Unexpected widget type:  " + widget.classID());
                    }
                });
                break;
        }
    }
    Visualization.prototype = Object.create(Class.prototype);
    Visualization.prototype.constructor = Visualization;

    Visualization.prototype.getQualifiedID = function () {
        return this.id;
    };

    Visualization.prototype.fields = function () {
        return this._fields;
    };

    Visualization.prototype.hasField = function (id) {
        return this.field[id] !== undefined;
    };

    Visualization.prototype.field = function (id) {
        return this._fieldsMap[id];
    };

    Visualization.prototype.loadedPromise = function () {
        var context = this;
        return new Promise(function (resolve, reject) {
            var intervalHandle = setInterval(function () {
                if (context.isLoaded()) {
                    clearInterval(intervalHandle);
                    resolve();
                }
            }, 100);
        });
    };

    Visualization.prototype.isLoading = function () {
        return this.widget === null;
    };

    Visualization.prototype.isLoaded = function () {
        return this.widget instanceof Widget;
    };


    Visualization.prototype.loadMegaChartWidget = function (widgetPath, callback) {
        this.loadWidgets(["../composite/MegaChart", widgetPath], function (megaChart, widgets) {
            var chart = new widgets[1]();
            megaChart
                .chartType_default(MultiChart.prototype._allChartTypesByClass[chart.classID()].id)
                .chart(chart)
            ;
            if (callback) {
                callback(megaChart, chart, widgets);
            }
        });
    };

    Visualization.prototype.loadWidget = function (widgetPath, callback) {
        this.loadWidgets([widgetPath], callback);
    };

    Visualization.prototype.loadWidgets = function (widgetPaths, callback) {
        this.widget = null;

        var context = this;
        require(widgetPaths, function (Widget) {
            var existingWidget = context.dashboard.marshaller.getWidget(context.id);
            if (existingWidget) {
                if (Widget.prototype._class !== existingWidget.classID()) {
                    console.log("Unexpected persisted widget type (old persist string?)");
                }
                context.setWidget(existingWidget);
            } else {
                context.setWidget(new Widget());
            }
            if (callback) {
                callback(context.widget, arguments);
            }
        });
    };

    Visualization.prototype.setWidget = function (widget) {
        this.widget = widget;
        this.events.setWidget(widget);
        if (this.widget.columns) {
            var columns = this.source.getColumns();
            this.widget.columns(columns, true);
        }
        for (var key in this.properties) {
            switch (widget.classID()) {
                case "chart_MultiChart":
                case "composite_MegaChart":
                    if (widget[key + "_default"]) {
                        widget[key + "_default"](this.properties[key]);
                    }
                    widget.chartTypeDefaults()[key] = this.properties[key];
                    break;
                default:
                    if (this.widget[key + "_default"]) {
                        try {
                            this.widget[key + "_default"](this.properties[key]);
                        } catch (e) {
                            console.log("Invalid Property:" + this.id + ".properties." + key);
                        }
                    }
            }
        }
        return this.widget;
    };

    Visualization.prototype.accept = function (visitor) {
        visitor.visit(this);
    };

    Visualization.prototype.getUpdates = function () {
        return this.events.getUpdates();
    };

    Visualization.prototype.getUpdatesForDatasource = function (otherDatasource) {
        return this.events.getUpdates().filter(function (updateObj) {
            return updateObj.getDatasource() === otherDatasource;
        });
    };

    Visualization.prototype.getUpdatesForVisualization = function (otherViz) {
        return this.events.getUpdates().filter(function (updateObj) {
            return updateObj.getVisualization() === otherViz;
        });
    };

    Visualization.prototype.update = function (params) {
        if (!params) {
            var paramsArr = [];
            var dedupParams = {};
            var updatedBy = this.getInputVisualizations();
            updatedBy.forEach(function (viz) {
                if (viz.hasSelection()) {
                    viz.getUpdatesForVisualization(this).forEach(function (updateObj) {
                        var mappedData = updateObj.mapSelected();
                        for (var key in mappedData) {
                            if (mappedData[key]) {
                                if (!dedupParams[key]) {
                                    dedupParams[key] = true;
                                    paramsArr.push(mappedData[key]);
                                }
                            }
                        }
                    });
                }
            }, this);
            params = paramsArr.join(", ");
        }

        var titleWidget = null;
        if (!this.parentVisualization) {
            titleWidget = this.widget;
            while (titleWidget && !titleWidget.title) {
                titleWidget = titleWidget.locateParentWidget();
            }
        }

        var context = this;
        return new Promise(function (resolve, reject) {
            if (titleWidget) {
                var title = titleWidget.title();
                var titleParts = title.split(" (");
                titleWidget
                    .title(titleParts[0] + (params ? " (" + params + ")" : ""))
                    .render(function () {
                        resolve();
                    })
                ;
            } else {
                var ddlViz = context;
                while (ddlViz.parentVisualization) {
                    ddlViz = ddlViz.parentVisualization;
                }
                ddlViz.widget.render(function () {
                    resolve();
                });
            }
            if (context.dashboard.marshaller.propogateClear()) {
                context.events.getUpdatesVisualizations().forEach(function (updatedViz) {
                    updatedViz.update();
                });
            }
        });
    };

    Visualization.prototype.notify = function () {
        if (this.widget) {
            var data = this.source.hasData() ? this.source.getData() : [];
            this.widget.data(data);
            return this.update();
        }
        return Promise.resolve();
    };

    Visualization.prototype.clear = function () {
        this._widgetState = {
            row: {},
            selected: false
        };
        this.fields().forEach(function (field) {
            if (field.hasDefault()) {
                this._widgetState.row[field.id()] = field.default();
                this._widgetState.selected = true;
            }
        }, this);
        if (this.widget && this.dashboard.marshaller.clearDataOnUpdate()) {
            this.widget.data([]);
        }
        if (this.dashboard.marshaller.propogateClear()) {
            this.events.getUpdatesVisualizations().forEach(function (updatedViz) {
                updatedViz.clear();
            });
        }
    };

    Visualization.prototype.on = function (eventID, func) {
        var context = this;
        this.overrideMethod(eventID, function (origFunc, args) {
            origFunc.apply(context, args);
            setTimeout(function () {
                func.apply(context, args);
            }, 0);
        });
        return this;
    };

    Visualization.prototype.calcRequestFor = function (visualization) {
        var retVal = {};
        this.getUpdatesForVisualization(visualization).forEach(function (updatesObj) {
            //  TODO:  When we support more than "click" this will need enhancment...
            retVal = updatesObj.calcRequestFor(visualization);
        });
        return retVal;
    };

    Visualization.prototype.processEvent = function (eventID, event, row, col, selected) {
        this._widgetState = {
            row: row,
            col: col,
            selected: selected === undefined ? true : selected
        };
        var context = this;
        setTimeout(function () {
            event.fetchData().then(function (promises) {
                context.dashboard.marshaller.vizEvent(context.widget, "post_" + eventID, row, col, selected);
            });
        }, 0);
    };

    Visualization.prototype.hasSelection = function () {
        return this._widgetState && this._widgetState.selected;
    };

    Visualization.prototype.selection = function () {
        if (this.hasSelection()) {
            return this._widgetState.row;
        }
        return null;
    };

    Visualization.prototype.reverseMappedSelection = function () {
        if (this.hasSelection()) {
            return this.source.mappings ? this.source.mappings.doReverseMap(this._widgetState.row) : this._widgetState.row;
        }
        return null;
    };

    Visualization.prototype.getInputVisualizations = function () {
        return this.dashboard.marshaller.getVisualizationArray().filter(function (viz) {
            var updates = viz.events.getUpdatesVisualizations();
            if (updates.indexOf(this) >= 0) {
                return true;
            }
            return false;
        }, this);
    };

    Visualization.prototype.serializeState = function () {
        var state = {
            widgetState: this._widgetState
        };
        if (this.widget) {
            if (this.widget.serializeState) {
                state.widget = this.widget.serializeState();
            } else if (this.widget.data) {
                state.widget = {
                    data: this.widget.data()
                };
            }
        }
        return state;
    };

    Visualization.prototype.deserializeState = function (state) {
        if (state) {
            this._widgetState = state.widgetState;
            if (this.widget && state.widget) {
                if (this.widget.deserializeState) {
                    this.widget.deserializeState(state.widget);
                } else if (this.widget.data && state.widget.data) {
                    this.widget.data(state.widget.data);
                }
            }
        }
        return this;
    };

    //  Output  ---
    function Filter(ddlFilter) {
        if (typeof ddlFilter === "string") {
            ddlFilter = {
                fieldid: ddlFilter,
                nullable: true,
                rule: "=="
            };
        }
        this.fieldid = ddlFilter.fieldid;
        this.nullable = ddlFilter.nullable;
        this.rule = ddlFilter.rule || "==";
        this.minid = ddlFilter.minid;
        this.maxid = ddlFilter.maxid;
    }

    Filter.prototype.tidyFieldID = function () {
        switch (this.rule) {
            case "<":
            case "<=":
                return this.fieldid.substring(0, this.fieldid.length - 4); //  Remove "_min";
            case ">":
            case ">=":
                return this.fieldid.substring(0, this.fieldid.length - 4); //  Remove "_max";
        }
        return this.fieldid;
    };

    Filter.prototype.isRange = function () {
        return this.rule === "range";
    };

    Filter.prototype._calcRequest = function (filteredRequest, request, fieldid, value) {
        filteredRequest[fieldid + _CHANGED] = request[fieldid + _CHANGED] || false;
        if (filteredRequest[fieldid] !== value) {
            filteredRequest[fieldid] = value;
        }
    };

    Filter.prototype.calcRequest = function (filteredRequest, request) {
        var value = request[this.fieldid] === undefined ? null : request[this.fieldid];
        if (this.isRange()) {
            if (value instanceof Array && value.length === 2) {
                this._calcRequest(filteredRequest, request, this.minid, value[0]);
                this._calcRequest(filteredRequest, request, this.maxid, value[1]);
            }
        } else {
            this._calcRequest(filteredRequest, request, this.fieldid, value);
        }
    };

    Filter.prototype.matches = function (row, value) {
        if (value === undefined || value === null || value === "") {
            return this.nullable;
        }
        var rowValue = row[this.tidyFieldID()];
        if (rowValue === undefined) {
            rowValue = row[this.tidyFieldID().toLowerCase()];
        }
        switch (this.rule) {
            case "<":
                if (rowValue.localeCompare) {
                    return rowValue.localeCompare(value) < 0;
                }
                return rowValue < value;
            case ">":
                if (rowValue.localeCompare) {
                    return rowValue.localeCompare(value) > 0;
                }
                return rowValue > value;
            case "<=":
                if (rowValue.localeCompare) {
                    return rowValue.localeCompare(value) <= 0;
                }
                return rowValue <= value;
            case ">=":
                if (rowValue.localeCompare) {
                    return rowValue.localeCompare(value) >= 0;
                }
                return rowValue >= value;
            case "==":
                /* falls through */
            default:
                return value == rowValue;    // jshint ignore:line
        }
        console.log("Unknown filter rule:  '" + this.rule + "'");
        return false;
    };
    
    function Output(datasource, output) {
        this.datasource = datasource;
        this.id = output.id;
        this.from = output.from;
        this.notify = output.notify || [];
        this.filters = (output.filter || []).map(function (filter) {
            return new Filter(filter);
        });
    }

    Output.prototype.getQualifiedID = function () {
        return this.datasource.getQualifiedID() + "." + this.id;
    };

    Output.prototype.getUpdatesVisualizations = function () {
        var retVal = [];
        this.notify.forEach(function (item) {
            retVal.push(this.datasource.marshaller.getVisualization(item));
        }, this);
        return retVal;
    };

    Output.prototype.accept = function (visitor) {
        visitor.visit(this);
    };

    Output.prototype.vizNotify = function (updates) {
        var promises = [];
        this.notify.filter(function (item) {
            return !updates || updates.indexOf(item) >= 0;
        }).forEach(function (item) {
            var viz = this.datasource.marshaller.getVisualization(item);
            promises.push(viz.notify());
        }, this);
        return Promise.all(promises);
    };

    Output.prototype.setData = function (data, updates) {
        this.db = new Database.Grid().jsonObj(data);
        return this.vizNotify(updates);
    };

    //  FetchData Optimizers  ---
    function DatasourceRequestOptimizer() {
        this.datasourceRequests = {
        };
    }

    DatasourceRequestOptimizer.prototype.appendRequest = function (updateDatasource, request, updateVisualization) {
        var datasourceRequestID = updateDatasource.id + "(" + JSON.stringify(request) + ")";
        if (!this.datasourceRequests[datasourceRequestID]) {
            this.datasourceRequests[datasourceRequestID] = {
                updateDatasource: updateDatasource,
                request: request,
                updates: []
            };
        } else if (window.__hpcc_debug) {
            console.log("Optimized duplicate fetch:  " + datasourceRequestID);
        }
        var datasourceOptimizedItem = this.datasourceRequests[datasourceRequestID];
        if (datasourceOptimizedItem.updates.indexOf(updateVisualization.id) < 0) {
            datasourceOptimizedItem.updates.push(updateVisualization.id);
        }
    };

    DatasourceRequestOptimizer.prototype.fetchData = function () {
        var promises = [];
        for (var key in this.datasourceRequests) {
            var item = this.datasourceRequests[key];
            promises.push(item.updateDatasource.fetchData(item.request, item.updates));
        }
        return Promise.all(promises);
    };

    function VisualizationRequestOptimizer(skipClear) {
        this.skipClear = skipClear;
        this.visualizationRequests = {
        };
    }

    VisualizationRequestOptimizer.prototype.appendRequest = function (updateDatasource, request, updateVisualization) {
        if (updateDatasource && updateVisualization) {
            var visualizationRequestID = updateVisualization.id + "(" + updateDatasource.id + ")";
            if (!this.visualizationRequests[visualizationRequestID]) {
                this.visualizationRequests[visualizationRequestID] = {
                    updateVisualization: updateVisualization,
                    updateDatasource: updateDatasource,
                    request: {}
                };
            } else if (window.__hpcc_debug) {
                console.log("Optimized duplicate fetch:  " + visualizationRequestID);
            }
            var visualizationOptimizedItem = this.visualizationRequests[visualizationRequestID];
            Utility.mixin(visualizationOptimizedItem.request, request);
        }
    };

    VisualizationRequestOptimizer.prototype.fetchData = function () {
        var datasourceRequestOptimizer = new DatasourceRequestOptimizer();
        for (var key in this.visualizationRequests) {
            var item = this.visualizationRequests[key];
            if (!this.skipClear && item.updateVisualization.type !== "GRAPH") {
                item.updateVisualization.clear();
            }
            item.updateVisualization.update(LOADING);
            datasourceRequestOptimizer.appendRequest(item.updateDatasource, item.request, item.updateVisualization);
        }
        return datasourceRequestOptimizer.fetchData();
    };

    //  Datasource  ---
    function Datasource(marshaller, datasource, proxyMappings, timeout) {
        this.marshaller = marshaller;
        this.id = datasource.id;
        this.filters = (datasource.filter || []).map(function (filter) {
            return new Filter(filter);
        });
        this.WUID = datasource.WUID;
        this.URL = (marshaller.espUrl && marshaller.espUrl.url()) ? marshaller.espUrl.url() : datasource.URL;
        this.databomb = datasource.databomb;
        this._loadedCount = 0;

        var context = this;
        this._outputs = {};
        this._outputArray = [];
        var hipieResults = [];
        datasource.outputs.forEach(function (item) {
            var output = new Output(context, item);
            context._outputs[item.id] = output;
            context._outputArray.push(output);
            hipieResults.push({
                id: item.id,
                from: item.from,
                filters: output.filters || this.filters
            });
        }, this);

        if (this.WUID) {
            this.comms = new Comms.HIPIEWorkunit()
                .url(this.URL)
                .proxyMappings(proxyMappings)
                .timeout(timeout)
                .hipieResults(hipieResults)
            ;
        } else if (this.databomb) {
            this.comms = new Comms.HIPIEDatabomb()
                .hipieResults(hipieResults)
            ;
        } else {
            this.comms = new Comms.HIPIERoxie()
                .url(datasource.URL)
                .proxyMappings(proxyMappings)
                .timeout(timeout)
            ;
        }
    }

    Datasource.prototype.getQualifiedID = function () {
        return this.id;
    };

    Datasource.prototype.getOutputs = function () {
        return this._outputs;
    };

    Datasource.prototype.getUpdatesVisualizations = function () {
        var retVal = [];
        for (var key in this._outputs) {
            this._outputs[key].getUpdatesVisualizations().forEach(function (visualization) {
                retVal.push(visualization);
            });
        }
        return retVal;
    };

    Datasource.prototype.accept = function (visitor) {
        visitor.visit(this);
        for (var key in this._outputs) {
            this._outputs[key].accept(visitor);
        }
    };

    var transactionID = 0;
    var transactionQueue = [];
    Datasource.prototype.fetchData = function (request, updates) {
        var myTransactionID = ++transactionID;
        transactionQueue.push(myTransactionID);

        var dsRequest = {};
        this.filters.forEach(function (item) {
            item.calcRequest(dsRequest, request);
        });
        dsRequest.refresh = request.refresh || false;
        if (true || window.__hpcc_debug) {
            console.log("fetchData:  " + JSON.stringify(updates) + "(" + JSON.stringify(request) + ")");
        }
        for (var key in dsRequest) {
            if (dsRequest[key] === undefined) {
                delete dsRequest[key];
            }
        }
        var now = Date.now();
        this.marshaller.commsEvent(this, "request", dsRequest);
        var context = this;
        return new Promise(function (resolve, reject) {
            context.comms.call(dsRequest).then(function (_response) {
                var response = JSON.parse(JSON.stringify(_response));
                var intervalHandle = setInterval(function () {
                    if (transactionQueue[0] === myTransactionID && Date.now() - now >= 500) {  //  500 is to allow for all "clear" transitions to complete...
                        clearTimeout(intervalHandle);
                        context.processResponse(response, dsRequest, updates).then(function () {
                            transactionQueue.shift();
                            resolve(response);
                            context.marshaller.commsEvent(context, "response", dsRequest, response);
                            ++context._loadedCount;
                        });
                    }
                }, 100);
            }).catch(function (e) {
                context.marshaller.commsEvent(context, "error", dsRequest, e);
                reject(e);
            });
        });
    };

    Datasource.prototype.processResponse = function (response, request, updates) {
        var lowerResponse = {};
        for (var responseKey in response) {
            lowerResponse[responseKey.toLowerCase()] = response[responseKey];
        }
        var promises = [];
        for (var key in this._outputs) {
            var from = this._outputs[key].from;
            if (!from) {
                //  Temp workaround for older services  ---
                from = this._outputs[key].id.toLowerCase();
            }
            if (Utility.exists(from, response)) {
                if (!Utility.exists(from + _CHANGED, response) || (Utility.exists(from + _CHANGED, response) && response[from + _CHANGED].length && response[from + _CHANGED][0][from + _CHANGED])) {
                    promises.push(this._outputs[key].setData(response[from], updates));
                } else {
                    //  TODO - I Suspect there is a HIPIE/Roxie issue here (empty request)
                    promises.push(this._outputs[key].vizNotify(updates));
                }
            } else if (Utility.exists(from, lowerResponse)) {
                console.log("DDL 'Datasource.From' case is Incorrect");
                if (!Utility.exists(from + _CHANGED, lowerResponse) || (Utility.exists(from + _CHANGED, lowerResponse) && response[from + _CHANGED].length && lowerResponse[from + _CHANGED][0][from + _CHANGED])) {
                    promises.push(this._outputs[key].setData(lowerResponse[from], updates));
                } else {
                    //  TODO - I Suspect there is a HIPIE/Roxie issue here (empty request)
                    promises.push(this._outputs[key].vizNotify(updates));
                }
            } else {
                var responseItems = [];
                for (var responseKey2 in response) {
                    responseItems.push(responseKey2);
                }
                console.log("Unable to locate '" + from + "' in response {" + responseItems.join(", ") + "}");
            }
        }
        return Promise.all(promises);
    };

    Datasource.prototype.isLoaded = function(){
        return this._loadedCount > 0;
    };

    Datasource.prototype.isRoxie = function () {
        return !this.WUID && !this.databomb;
    };

    Datasource.prototype.serializeState = function () {
        return {
        };
    };

    Datasource.prototype.deserializeState = function (state) {
        if (!state) return;
    };

    //  Dashboard  ---
    function Dashboard(marshaller, dashboard, proxyMappings, timeout) {
        this.marshaller = marshaller;
        this.id = dashboard.id;
        this.title = dashboard.title;

        this._datasources = {};
        this._datasourceArray = [];
        this._datasourceTotal = 0;
        if (dashboard.datasources) {
            dashboard.datasources.forEach(function (item) {
                this.createDatasource(item, proxyMappings, timeout);
            }, this);
        }
        this._datasourceTotal = this._datasourceArray.length;

        this._visualizations = {};
        this._visualizationArray = [];
        dashboard.visualizations.forEach(function (item) {
            this.createVisualization(item);
        }, this);
        this._visualizationTotal = this._visualizationArray.length;
    }

    Dashboard.prototype.createDatasource = function(ddlDatasouce) {
        var retVal = this._datasources[ddlDatasouce.id];
        if (!retVal) {
            retVal = this.marshaller.createDatasource(ddlDatasouce);
            this._datasources[ddlDatasouce.id] = retVal;
            this._datasourceArray.push(retVal);
        }
        this._datasourceTotal = this._datasourceArray.length;
        return retVal;
    };

    Dashboard.prototype.createVisualization = function (ddlVisualization, parentVisualization) {
        var retVal = new Visualization(this, ddlVisualization, parentVisualization);
        this._visualizations[ddlVisualization.id] = retVal;
        this._visualizationArray.push(retVal);
        this.marshaller.appendVisualization(retVal);
        return retVal;
    };

    Dashboard.prototype.loadedPromise = function () {
        return Promise.all(this._visualizationArray.map(function (visualization) { return visualization.loadedPromise(); }));
    };

    Dashboard.prototype.getQualifiedID = function () {
        return this.id;
    };

    Dashboard.prototype.getDatasources = function() {
        return this._datasources;
    };

    Dashboard.prototype.getDatasourceArray = function () {
        return this._datasourceArray;
    };

    Dashboard.prototype.getDatasource = function (id) {
        return this._datasources[id] || this.marshaller.getDatasource(id);
    };

    Dashboard.prototype.getDataSourceArray = function () {
        return this._datasourceArray;
    };

    Dashboard.prototype.getVisualization = function (id) {
        return this._visualizations[id] || this.marshaller.getVisualization(id);
    };

    Dashboard.prototype.getVisualizations = function () {
        return this._visualizations;
    };

    Dashboard.prototype.getVisualizationArray = function () {
        return this._visualizationArray;
    };

    Dashboard.prototype.getVisualizationTotal = function () {
        return this._visualizationTotal;
    };

    Dashboard.prototype.accept = function (visitor) {
        visitor.visit(this);
        for (var key in this._datasources) {
            this._datasources[key].accept(visitor);
        }
        this._visualizationArray.forEach(function (item) {
            item.accept(visitor);
        }, this);
    };

    Dashboard.prototype.primeData = function (state) {
        var fetchDataOptimizer = new VisualizationRequestOptimizer(true);
        this.getVisualizationArray().forEach(function (visualization) {
            //  Clear all charts back to their default values ---
            visualization.clear();
            visualization.update();
            if (state && state[visualization.id]) {
                if (Utility.exists("source.mappings.mappings", visualization)) {
                    for (var key in visualization.source.mappings.mappings) {
                        if (state[visualization.id][visualization.source.mappings.mappings[key]]) {
                            visualization._widgetState.row[key] = state[visualization.id][visualization.source.mappings.mappings[key]];
                            visualization._widgetState.selected = true;
                        }
                    }
                }
            }
        });
        this.getVisualizationArray().forEach(function (visualization) {
            var inputVisualizations = visualization.getInputVisualizations();
            var datasource = visualization.source.getDatasource();
            var hasInputSelection = false;
            inputVisualizations.forEach(function (inViz) {
                if (inViz.hasSelection()) {
                    var request = inViz.calcRequestFor(visualization);
                    request.refresh = true;
                    fetchDataOptimizer.appendRequest(datasource, request, visualization);
                    hasInputSelection = true;
                }
            });
            if (!hasInputSelection && ((datasource && datasource.isRoxie()) || inputVisualizations.length === 0)) {
                fetchDataOptimizer.appendRequest(datasource, { refresh: true }, visualization);
            }
        });
        return fetchDataOptimizer.fetchData();
    };

    Dashboard.prototype.serializeState = function () {
        var retVal = {
            datasources: {},
            visualizations: {}
        };
        for (var key in this._datasources) {
            retVal.datasources[key] = this._datasources[key].serializeState();
        }
        for (var vizKey in this._visualizations) {
            retVal.visualizations[vizKey] = this._visualizations[vizKey].serializeState();
        }
        return retVal;
    };

    Dashboard.prototype.deserializeState = function (state) {
        if (!state) return;
        for (var key in this._datasources) {
            if (state.datasources[key]) {
                this._datasources[key].deserializeState(state.datasources[key]);
            }
        }
        for (var vizKey in this._visualizations) {
            if (state.visualizations[vizKey]) {
                this._visualizations[vizKey].deserializeState(state.visualizations[vizKey]);
            }
        }
    };

    //  Marshaller  ---
    function Marshaller() {
        Class.call(this);

        this._proxyMappings = {};
        this._widgetMappings = d3.map();
        this._clearDataOnUpdate = true;
        this._propogateClear = false;
        this.id = "Marshaller";
        this._missingDataString = "";
        this.dashboards = {};
        this.dashboardArray = [];

        this._datasources = {};
        this._datasourceArray = [];
        this._visualizations = {};
        this._visualizationArray = [];
    }
    Marshaller.prototype = Object.create(Class.prototype);
    Marshaller.prototype.constructor = Marshaller;

    Marshaller.prototype.commsDataLoaded = function () {
        for (var i = 0; i < this.dashboardArray.length; i++) {
            for (var ds in this.dashboardArray[i].getDatasources()) {
                if (!this.dashboardArray[i].getDatasource(ds).isLoaded()) {
                    return false;
                }
            }
        }
        return true;
    };

    Marshaller.prototype.accept = function (visitor) {
        visitor.visit(this);
        this.dashboardTotal = 0;
        for (var key in this.dashboards) {
            this.dashboards[key].accept(visitor);
            ++this.dashboardTotal;
        }
    };

    Marshaller.prototype.url = function (url, callback) {
        this.espUrl = new Comms.ESPUrl()
            .url(url)
        ;
        var transport = null;
        var hipieResultName = "HIPIE_DDL";
        if (this.espUrl.isWorkunitResult()) {
            hipieResultName = this.espUrl.param("ResultName");
            transport = new Comms.HIPIEWorkunit()
                .url(url)
                .proxyMappings(this._proxyMappings)
                .timeout(this._timeout)
            ;
        } else {
            transport = new Comms.HIPIERoxie()
                .url(url)
                .proxyMappings(this._proxyMappings)
                .timeout(this._timeout)
            ;
        }

        var context = this;
        transport.fetchResults().then(function (response) {
            if (Utility.exists(hipieResultName, response)) {
                return transport.fetchResult(hipieResultName).then(function (ddlResponse) {
                    var json = ddlResponse[0][hipieResultName];
                    context.parse(json, function () {
                        callback(response);
                    });
                }).catch(function (e) {
                    context.commsEvent(context, "error", hipieResultName, e);
                });
            }
        }).catch(function (e) {
            context.commsEvent(context, "error", "fetchResults", e);
        });
    };

    Marshaller.prototype.proxyMappings = function (_) {
        if (!arguments.length) return this._proxyMappings;
        this._proxyMappings = _;
        return this;
    };

    Marshaller.prototype.timeout = function (_) {
        if (!arguments.length) return this._timeout;
        this._timeout = _;
        return this;
    };

    Marshaller.prototype.widgetMappings = function (_) {
        if (!arguments.length) return this._widgetMappings;
        this._widgetMappings = _;
        return this;
    };

    Marshaller.prototype.clearDataOnUpdate = function (_) {
        if (!arguments.length) return this._clearDataOnUpdate;
        this._clearDataOnUpdate = _;
        return this;
    };

    Marshaller.prototype.propogateClear = function (_) {
        if (!arguments.length) return this._propogateClear;
        this._propogateClear = _;
        return this;
    };

    Marshaller.prototype.missingDataString = function (_) {
        if (!arguments.length) return this._missingDataString;
        this._missingDataString = _;
        return this;
    };

    Marshaller.prototype.parse = function (json, callback) {
        var context = this;
        this._json = json;
        this._jsonParsed = JSON.parse(this._json);
        this._jsonParsed.datasources[0].filter[0].nullable = true;

        //  Global Datasources  --- 
        this._datasources = {};
        this._datasourceArray = [];
        if (this._jsonParsed.datasources) {
            this._jsonParsed.datasources.forEach(function (item) {
                context.createDatasource(item);
            });
        }

        this.dashboards = {};
        this.dashboardArray = [];
        this._visualizations = {};
        this._visualizationArray = [];
        var dashboards = this._jsonParsed.dashboards || this._jsonParsed;
        dashboards.forEach(function (item) {
            var newDashboard = new Dashboard(context, item, context._proxyMappings, context._timeout);
            context.dashboards[item.id] = newDashboard;
            context.dashboardArray.push(newDashboard);
        });
        this.dashboardTotal = this.dashboardArray.length;
        this._visualizationArray.forEach(function (ddlViz) {
            ddlViz.on("processEvent", function (eventID, event, row, col, selected) {
                context.vizEvent(ddlViz.widget, eventID, row, col, selected);
            });
        });
        this._datasourceTotal = this._datasourceArray.length;

        this.ready(callback);
        return this;
    };

    Marshaller.prototype.dashboardsLoaded = function () {
        return Promise.all(this.dashboardArray.map(function (dashboard) { return dashboard.loadedPromise(); }));
    };

    Marshaller.prototype.createDatasource = function (ddlDatasouce) {
        var retVal = this._datasources[ddlDatasouce.id];
        if (!retVal) {
            retVal = new Datasource(this, ddlDatasouce, this._proxyMappings, this._timeout);
            this._datasources[ddlDatasouce.id] = retVal;
            this._datasourceArray.push(retVal);
        }
        this._datasourceTotal = this._datasourceArray.length;
        return retVal;
    };

    Marshaller.prototype.getDatasource = function (id) {
        return this._datasources[id];
    };

    Marshaller.prototype.getDatasources = function () {
        return this._datasources;
    };

    Marshaller.prototype.getDatasourceArray = function () {
        return this._datasourceArray;
    };

    Marshaller.prototype.appendVisualization = function(visualization) {
        this._visualizations[visualization.id] = visualization;
        this._visualizationArray.push(visualization);
    };

    Marshaller.prototype.getVisualization = function (id) {
        return this._visualizations[id];
    };

    Marshaller.prototype.appendDataSource = function (datasource) {
        this._datasources[datasource.id] = datasource;
        this._datasourceArray.push(datasource);
    };

    Marshaller.prototype.getVisualizations = function () {
        return this._visualizations;
    };

    Marshaller.prototype.getVisualizationArray = function () {
        return this._visualizationArray;
    };

    Marshaller.prototype.getWidget = function (id) {
        return this._widgetMappings[id];
    };

    Marshaller.prototype.on = function (eventID, func) {
        var context = this;
        this.overrideMethod(eventID, function (origFunc, args) {
            var retVal = origFunc.apply(context, args);
            return func.apply(context, args) || retVal;
        });
        return this;
    };

    Marshaller.prototype.ready = function (callback) {
        if (!callback) {
            return;
        }
        this.dashboardsLoaded().then(function () {
            callback();
        });
    };

    Marshaller.prototype.vizEvent = function (sourceWidget, eventID, row, col, selected) {
        console.log("Marshaller.vizEvent:  " + sourceWidget.id() + "-" + eventID);
    };

    Marshaller.prototype.commsEvent = function (ddlSource, eventID, request, response) {
        switch (eventID) {
            case "request":
                if (window.__hpcc_debug) {
                    console.log("Marshaller.commsEvent:  " + ddlSource.id + "-" + eventID + ":  " + JSON.stringify(request));
                }
                break;
            case "response":
            case "error":
                if (window.__hpcc_debug) {
                    console.log("Marshaller.commsEvent:  " + ddlSource.id + "-" + eventID + ":  " + JSON.stringify(response));
                }
                break;
            default:
                if (window.__hpcc_debug) {
                    console.log("Marshaller.commsEvent:  " + JSON.stringify(arguments));
                }
                break;

        }
    };

    Marshaller.prototype.createDatabomb = function () {
        var retVal = {};
        this.dashboardArray.forEach(function (dashboard) {
            for (var key in dashboard.getDatasources()) {
                var comms = dashboard.getDatasource(key).comms;
                retVal[key] = {};
                for (var key2 in comms._hipieResults) {
                    var hipieResult = comms._hipieResults[key2];
                    retVal[key][key2] = comms._resultNameCache[hipieResult.from];
                }
            }
        });
        return retVal;
    };

    Marshaller.prototype.primeData = function (state) {
        var promises = this.dashboardArray.map(function (dashboard) {
            return dashboard.primeData(state);
        });
        return Promise.all(promises);
    };

    Marshaller.prototype.serializeState = function () {
        var retVal = {};
        this.dashboardArray.forEach(function (dashboard, idx) {
            retVal[dashboard.id] = dashboard.serializeState();
        });
        return retVal;
    };

    Marshaller.prototype.deserializeState = function (state) {
        if (!state) return;
        this.dashboardArray.forEach(function (dashboard, idx) {
            dashboard.deserializeState(state[dashboard.id]);
        });
        return this;
    };

    return {
        Marshaller: Marshaller,
        Dashboard: Dashboard,
        Datasource: Datasource,
        Output: Output,
        Visualization: Visualization
    };
}));


(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define('marshaller/HipieDDLMixin.js',["d3", "../common/Class", "../common/PropertyExt", "../common/Utility", "./HipieDDL", "../other/Persist", "../layout/Surface", "./FlyoutButton"], factory);
    } else {
        root.marshaller_HipieDDLMixin = factory(root.d3, root.common_Class, root.common_PropertyExt, root.common_PropertyExt, root.common_Utility, root.other_Persist, root.layout_Surface, root.marshaller_FlyoutButton);
    }
}(this, function (d3, Class, PropertyExt, Utility, HipieDDL, Persist, Surface, FlyoutButton) {

    function HipieDDLMixin() {
        Class.call(this);
        PropertyExt.call(this);
    }
    HipieDDLMixin.prototype = Object.create(Class.prototype);
    HipieDDLMixin.prototype.constructor = HipieDDLMixin;
    HipieDDLMixin.prototype.mixin(PropertyExt);
    HipieDDLMixin.prototype._class += " marshaller_HipieDDLMixin";

    HipieDDLMixin.prototype.publish("ddlUrl", "", "string", "DDL URL", null, { tags: ["Private"] });
    HipieDDLMixin.prototype.publish("databomb", "", "string", "Data Bomb", null, { tags: ["Private"] });
    HipieDDLMixin.prototype.publish("proxyMappings", {}, "object", "Proxy Mappings", null, { tags: ["Private"] });
    HipieDDLMixin.prototype.publish("timeout", null, "number", "Timout (seconds)", null, { optional: true });
    HipieDDLMixin.prototype.publish("clearDataOnUpdate", true, "boolean", "Clear data prior to refresh", null);
    HipieDDLMixin.prototype.publish("propogateClear", false, "boolean", "Propogate clear to dependent visualizations", null);
    HipieDDLMixin.prototype.publish("missingDataString", "***MISSING***", "string", "Missing data display string");
    HipieDDLMixin.prototype.publish("autoCloseFlyout", true, "boolean", "Auto Close Flyout Filters");

    HipieDDLMixin.prototype._gatherDashboards = function (marshaller, databomb) {
        if (databomb instanceof Object) {
        } else if (databomb) {
            databomb = JSON.parse(databomb);
        }
        this._ddlDashboards = [];
        this._ddlVisualizations = [];
        this._ddlPopupVisualizations = [];
        this._ddlLayerVisualizations = [];
        var context = this;
        var curr = null;
        marshaller.accept({
            visit: function (item) {
                if (item instanceof HipieDDL.Dashboard) {
                    curr = {
                        dashboard: item,
                        visualizations: [],
                        layerVisualizations: [],
                        popupVisualizations: []
                    };
                    context._ddlDashboards.push(curr);
                } else if (item instanceof HipieDDL.Datasource) {
                    if (item.databomb && databomb[item.id]) {
                        item.comms.databomb(databomb[item.id]);
                    }
                } else if (item instanceof HipieDDL.Output) {
                    if (item.datasource.databomb) {
                        item.datasource.comms.databombOutput(item.from, item.id);
                    }
                } else if (item instanceof HipieDDL.Visualization) {
                    if (item.widget) {
                        if (item.properties.flyout) {
                            curr.popupVisualizations.push(item);
                            context._ddlPopupVisualizations.push(item);
                        } else if (item.parentVisualization) {
                            curr.layerVisualizations.push(item);
                            context._ddlLayerVisualizations.push(item);
                        } else {
                            curr.visualizations.push(item);
                            context._ddlVisualizations.push(item);
                        }
                    }
                }
            }
        });
    };

    HipieDDLMixin.prototype._marshallerRender = function (BaseClass, callback) {
        if (this.ddlUrl() === "" || (this.ddlUrl() === this._prev_ddlUrl && this.databomb() === this._prev_databomb)) {
            if (this._marshaller) {
                this._marshaller
                    .proxyMappings(this.proxyMappings())
                    .timeout(this.timeout())
                    .clearDataOnUpdate(this.clearDataOnUpdate())
                    .propogateClear(this.propogateClear())
                    .missingDataString(this.missingDataString())
                ;
            }
            return BaseClass.render.call(this, function (widget) {
                if (callback) {
                    callback(widget);
                }
            });
        }
        if (this._prev_ddlUrl && this._prev_ddlUrl !== this.ddlUrl()) {
            //  DDL has actually changed (not just a deserialization)
            this
                .clearContent()
            ;
        }
        this._prev_ddlUrl = this.ddlUrl();
        this._prev_databomb = this.databomb();

        //  Gather existing widgets for reuse  ---
        var widgetArr = [];
        Persist.widgetArrayWalker(this.content(), function (w) {
            widgetArr.push(w);
        });
        var widgetMap = d3.map(widgetArr, function (d) {
            return d.id();
        });
        var removedMap = d3.map(widgetArr.filter(function (d) { return d.id().indexOf(d._idSeed) !== 0 && d.id().indexOf("_pe") !== 0; }), function (d) {
            return d.id();
        });

        var context = this;
        this._marshaller = new HipieDDL.Marshaller()
            .proxyMappings(this.proxyMappings())
            .clearDataOnUpdate(this.clearDataOnUpdate())
            .propogateClear(this.propogateClear())
            .missingDataString(this.missingDataString())
            .widgetMappings(widgetMap)
            .on("commsEvent", function (source, error) {
                context.commsEvent.apply(context, arguments);
            })
            .on("vizEvent", function () {
                context.vizEvent.apply(context, arguments);
            })
        ;

        //  Parse DDL  ---
        if (this.ddlUrl()[0] === "[" || this.ddlUrl()[0] === "{") {
            this._marshaller.parse(this.ddlUrl(), postParse);
        } else {
            this._marshaller.url(this.ddlUrl(), postParse);
        }

        function postParse() {
            context._gatherDashboards(context._marshaller, context.databomb());
            //  Remove existing widgets not used and prime popups ---
            context._ddlVisualizations.forEach(function (viz) {
                removedMap.remove(viz.id);
                if (!context._marshaller.widgetMappings().get(viz.id)) {
                    //  New widget  ---
                    viz.newWidgetSurface = null;
                    if (viz.widget instanceof Surface || viz.widget.classID() === "composite_MegaChart") {
                        viz.newWidgetSurface = viz.widget;
                    } else {
                        viz.newWidgetSurface = new Surface()
                            .widget(viz.widget)
                        ;
                    }
                    viz.newWidgetSurface.title(viz.title);
                    viz.widget.size({ width: 0, height: 0 });
                }
            });
            context._ddlPopupVisualizations.forEach(function (viz) {
                removedMap.remove(viz.id);
                viz.widget.classed({ "flyout": true });
                var targetVizs = viz.events.getUpdatesVisualizations();
                targetVizs.forEach(function (targetViz) {
                    switch (targetViz.widget.classID()) {
                        case "composite_MegaChart":
                            if (!viz._flyoutButton) {
                                viz._flyoutButton = new FlyoutButton()
                                    .classed({ "composite_MegaChart-flyout": true })
                                    .title(viz.title)
                                    .widget(viz.widget)
                                    .autoClose(context.autoCloseFlyout())
                                ;
                                targetViz.widget.toolbarWidgets().push(viz._flyoutButton);
                            } else {
                                targetViz.widget.toolbarWidgets().push(viz._flyoutButton.reference());
                            }
                            break;
                    }
                });
            });
            removedMap.forEach(function (key, value) {
                context.clearContent(value);
            });
            context.populateContent();
            if (context._initialState) {
                context._marshaller.deserializeState(context._initialState.marshaller);
                delete context._initialState;
                BaseClass.render.call(context, callback);
            } else {
                BaseClass.render.call(context, function (widget) {
                    context._marshaller.primeData().then(function (response) {
                        if (callback) {
                            callback(widget);
                        }
                    });
                });
            }
        }
    };

    HipieDDLMixin.prototype.primeData = function (state) {
        if (this._marshaller) {
            return this._marshaller.primeData(state);
        }
        return Promise.resolve();
    };

    HipieDDLMixin.prototype.dashboards = function () {
        var retVal = {};
        for (var key in this._marshaller.dashboards) {
            retVal[key] = {};
            this._marshaller.dashboards[key].visualizations.forEach(function (ddlViz) {
                retVal[key][ddlViz.id] = ddlViz.widget;
            }, this);
        }
        return retVal;
    };


    HipieDDLMixin.prototype.visualizations = function () {
        return this._marshaller._visualizationArray.map(function (ddlViz) {
            return ddlViz.newWidgetSurface || ddlViz.widget;
        });
    };

    //  ---
    var tpl =
"<!doctype html><html><head><meta charset='utf-8'>" +
"<script src='http://viz.hpccsystems.com/v1.14.0-rc5/dist-amd/hpcc-viz.js'></script>" +
"<script src='http://viz.hpccsystems.com/v1.14.0-rc5/dist-amd/hpcc-viz-common.js'></script>" +
"</head>" +
"<body style='padding:0px; margin:0px; overflow:hidden'><div id='placeholder' style='width:100%; height:100vh'></div><script>" + 
"   require(['src/other/Persist'], function (Persist) {\n" +
"       Persist.create({STATE}, function(widget) {\n" +
"           widget\n" +
"               .target('placeholder')\n" +
"               .ddlUrl('{DDL}')\n" +
"               .databomb('{DATABOMB}')\n" +
"               .render()\n" +
"           ;\n" +
"       });\n" +
"   });" +
"</script></body></html>";

    HipieDDLMixin.prototype.generateTestPage = function () {
        if (this._marshaller) {
            var context = this;
            var state = Persist.serialize(context, function (widget, publishItem) {
                if (publishItem.id === "databomb" || publishItem.id === "ddlUrl") {
                    return true;
                }
                return false;
            });
            var databomb = this._marshaller.createDatabomb();
            var page = tpl
                .replace("{VERSION}", context.version())
                .replace("{STATE}", state)
                .replace("{DDL}", context._marshaller._json.replace("WUID", "databomb"))
                .replace("{DATABOMB}", JSON.stringify(databomb))
            ;
            Utility.downloadBlob("html", page, "test");
        }
    };

    HipieDDLMixin.prototype.vizEvent = function (sourceWidget, eventID, row, col, selected) {
    };

    HipieDDLMixin.prototype.commsEvent = function (ddlSource, eventID, request, response) {
    };

    HipieDDLMixin.prototype.state = function (_) {
        if (!arguments.length) {
            return this.serializeState();
        }
        this.deserializeState(_);
        return this;
    };

    HipieDDLMixin.prototype.serializeState = function () {
        return {
            marshaller: this._marshaller ? this._marshaller.serializeState() : {}
        };
    };

    HipieDDLMixin.prototype.deserializeState = function (state) {
        if (this._marshaller) {
            this._marshaller.deserializeState(state.marshaller);
        } else {
            this._initialState = state;
        }
        return this;
    };

    HipieDDLMixin.prototype.serializeRequests = function () {
        var retVal = null;
        this._ddlPopupVisualizations.concat(this._ddlVisualizations).forEach(function (ddlViz) {
            if (ddlViz.hasSelection()) {
                if (!retVal) {
                    retVal = {};
                }
                retVal[ddlViz.id] = ddlViz.reverseMappedSelection();
            }
        });
        return retVal;
    };

    return HipieDDLMixin;
}));

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define('marshaller/Graph.js',["d3", "../common/SVGWidget", "../common/TextBox", "../common/Surface", "../common/ResizeSurface", "../chart/MultiChartSurface", "../common/Palette", "../graph/Graph", "../graph/Vertex", "../graph/Edge", "./HipieDDLMixin"], factory);
    } else {
        root.marshaller_Graph = factory(root.d3, root.common_SVGWidget, root.common_TextBox, root.common_Surface, root.common_ResizeSurface, root.chart_MultiChartSurface, root.common_Palette, root.graph_Graph, root.graph_Vertex, root.graph_Edge, root.marshaller_HipieDDLMixin);
    }
}(this, function (d3, SVGWidget, TextBox, Surface, ResizeSurface, MultiChartSurface, Palette, GraphWidget, Vertex, Edge, HipieDDLMixin) {
    function Graph() {
        GraphWidget.call(this);
        HipieDDLMixin.call(this);

        this._design_mode = false;
        this._dashboards = [];
        this.graphAttributes = ["snapToGrid", "showEdges"];
        this.widgetAttributes = ["layout", "chartType", "palette", "title", "columns", "data"];
        this.layout("Hierarchy");
        this.applyScaleOnLayout(true);
        this.content([]);
    }
    Graph.prototype = Object.create(GraphWidget.prototype);
    Graph.prototype.constructor = Graph;
    Graph.prototype.mixin(HipieDDLMixin);
    Graph.prototype._class += " marshaller_Graph";

    //TODO Still Needed?:  Graph.prototype.publish("visualizeRoxie", false, "boolean", "Show Roxie Data Sources", null, { tags: ["Private"] });
    Graph.prototype.publish("content", [], "widgetArray", "widgets", null, { tags: ["Basic"] });

    Graph.prototype.populateContent = function () {
        var vertices = [];
        var edges = [];
        this._ddlVisualizations.concat(this._ddlPopupVisualizations).forEach(function (viz) {
            if (viz.widget) {
                var newSurface = null;
                if (viz.widget instanceof ResizeSurface) {
                    newSurface = viz.widget
                        .size({ width: 210, height: 210 })
                    ;
                } else {    
                    var width = 280;
                    var height = 210;
                    newSurface = new ResizeSurface()
                        .showTitle(true)
                        .size({ width: width, height: height })
                        .content(viz.widget)
                    ;
                }
                if (newSurface) {
                    viz.newWidgetSurface = newSurface;
                }
                vertices.push(newSurface);
            }
            viz.getInputVisualizations().forEach(function () {
            }, this);
        }, this);
        this._ddlDashboards.forEach(function (dashboard) {
            dashboard.visualizations.forEach(function (viz) {
                viz.getInputVisualizations().forEach(function (inViz) {
                    edges.push(new Edge()
                        .sourceVertex(inViz.newWidgetSurface)
                        .targetVertex(viz.newWidgetSurface)
                        .targetMarker("arrowHead")
                    );
                }, this);
            }, this);
        }, this);
        this.content(vertices);
        this.data({ vertices: vertices, edges: edges });
    };

    Graph.prototype.enter = function (domNode, element) {
        GraphWidget.prototype.enter.apply(this, arguments);
        element.classed("graph_Graph", true);
    };

    Graph.prototype.render = function (callback) {
        this._marshallerRender(GraphWidget.prototype, callback);
        return this;
    };

    Graph.prototype.commsError = function (source, error) {
        alert("Comms Error:\n" + source + "\n" + error);
    };

    return Graph;
}));


(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define('marshaller/HTML.js',["d3", "../layout/Grid", "./HipieDDLMixin"], factory);
    } else {
        root.marshaller_HTML = factory(root.d3, root.layout_Grid, root.marshaller_HipieDDLMixin);
    }
}(this, function (d3, Grid, HipieDDLMixin) {
    function HTML() {
        Grid.call(this);
        HipieDDLMixin.call(this);

        this.surfacePadding_default(0);
    }
    HTML.prototype = Object.create(Grid.prototype);
    HTML.prototype.constructor = HTML;
    HTML.prototype.mixin(HipieDDLMixin);
    HTML.prototype._class += " marshaller_HTML";

    HTML.prototype.populateContent = function () {
        var cellRow = 0;
        var cellCol = 0;
        var cellDensity = 3;
        this._ddlDashboards.forEach(function (dashboard) {
            var maxCol = Math.floor(Math.sqrt(dashboard.visualizations.length));
            dashboard.visualizations.forEach(function (viz) {
                if (viz.newWidgetSurface) {
                    while (this.getCell(cellRow * cellDensity, cellCol * cellDensity) !== null) {
                        cellCol++;
                        if (cellCol % maxCol === 0) {
                            cellRow++;
                            cellCol = 0;
                        }
                    }
                    this.setContent(cellRow * cellDensity, cellCol * cellDensity, viz.newWidgetSurface, "", cellDensity, cellDensity);
                }
            }, this);
        }, this);

        var vizCellMap = {};
        this.content().forEach(function (cell) {
            var widget = cell.widget();
            if (widget && widget.classID() === "layout_Surface") {
                widget = widget.widget();
            }
            if (widget) {
                vizCellMap[widget.id()] = cell;
            }
        });

        this._ddlDashboards.forEach(function (dashboard) {
            dashboard.visualizations.forEach(function (viz, idx) {
                if (viz.properties.flyout || viz.parentVisualization) {
                    return;
                }
                var targetVizs = viz.events.getUpdatesVisualizations();
                var targetIDs = targetVizs.filter(function (targetViz) {
                    return vizCellMap[targetViz.id];
                }).map(function (targetViz) {
                    return vizCellMap[targetViz.id].id();
                });
                vizCellMap[viz.id].indicateTheseIds(targetIDs);
            });
        }, this);
    };

    HTML.prototype.enter = function (domNode, element) {
        Grid.prototype.enter.apply(this, arguments);
    };

    HTML.prototype.render = function (callback) {
        this._marshallerRender(Grid.prototype, callback);
        return this;
    };

    HTML.prototype.commsError = function (source, error) {
        alert("Comms Error:\n" + source + "\n" + error);
    };

    return HTML;
}));


(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define('marshaller/Tabbed.js',["d3", "../layout/Tabbed", "../layout/Grid", "./HipieDDLMixin"], factory);
    } else {
        root.marshaller_Tabbed = factory(root.d3, root.layout_Tabbed, root.layout_Grid, root.marshaller_HipieDDLMixin);
    }
}(this, function (d3, TabbedLayout, Grid, HipieDDLMixin) {
    function Tabbed() {
        TabbedLayout.call(this);
        HipieDDLMixin.call(this);

        this.surfacePadding_default(0);
    }
    Tabbed.prototype = Object.create(TabbedLayout.prototype);
    Tabbed.prototype.constructor = Tabbed;
    Tabbed.prototype.mixin(HipieDDLMixin);
    Tabbed.prototype._class += " marshaller_Tabbed";

    Tabbed.prototype.content = function () {
        var retVal = [];
        this.widgets().forEach(function (surface) {
            var grid = surface.widget();
            grid.content().forEach(function (widget) {
                retVal.push(widget);
            });
        });
        return retVal;
    };

    Tabbed.prototype.populateContent = function () {
        var cellDensity = 3;
        this._ddlDashboards.forEach(function (dashboard) {
            var grid = new Grid().surfacePadding(0);
            this.addTab(grid, dashboard.dashboard.title);
            var cellRow = 0;
            var cellCol = 0;
            var maxCol = Math.floor(Math.sqrt(dashboard.visualizations.length));
            dashboard.visualizations.forEach(function (viz) {
                if (viz.newWidgetSurface) {
                    while (grid.getCell(cellRow * cellDensity, cellCol * cellDensity) !== null) {
                        cellCol++;
                        if (cellCol % maxCol === 0) {
                            cellRow++;
                            cellCol = 0;
                        }
                    }
                    grid.setContent(cellRow * cellDensity, cellCol * cellDensity, viz.newWidgetSurface, "", cellDensity, cellDensity);
                }
            }, this);
        }, this);

        var vizCellMap = {};
        this.content().forEach(function (cell) {
            var widget = cell.widget();
            if (widget && widget.classID() === "layout_Surface") {
                widget = widget.widget();
            }
            if (widget) {
                vizCellMap[widget.id()] = cell;
            }
        });

        this._ddlDashboards.forEach(function (dashboard) {
            dashboard.visualizations.forEach(function (viz, idx) {
                if (viz.properties.flyout || viz.parentVisualization) {
                    return;
                }
                var targetVizs = viz.events.getUpdatesVisualizations();
                var targetIDs = targetVizs.filter(function (targetViz) {
                    return vizCellMap[targetViz.id];
                }).map(function (targetViz) {
                    return vizCellMap[targetViz.id].id();
                });
                vizCellMap[viz.id].indicateTheseIds(targetIDs);
            });
        }, this);
    };

    Tabbed.prototype.enter = function (domNode, element) {
        TabbedLayout.prototype.enter.apply(this, arguments);
    };

    Tabbed.prototype.render = function (callback) {
        this._marshallerRender(TabbedLayout.prototype, callback);
        return this;
    };

    Tabbed.prototype.commsError = function (source, error) {
        alert("Comms Error:\n" + source + "\n" + error);
    };

    return Tabbed;
}));


(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define('marshaller/TargetMarshaller.js',["d3", "../common/HTMLWidget", "./HipieDDLMixin"], factory);
    } else {
        root.marshaller_TargetMarshaller = factory(root.d3, root.common_HTMLWidget, root.marshaller_HipieDDLMixin);
    }
}(this, function (d3, HTMLWidget, HipieDDLMixin) {
    function TargetMarshaller() {
        HTMLWidget.call(this);
        HipieDDLMixin.call(this);
        this._tag = "div";
    }
    TargetMarshaller.prototype = Object.create(HTMLWidget.prototype);
    TargetMarshaller.prototype.constructor = TargetMarshaller;
    TargetMarshaller.prototype.mixin(HipieDDLMixin);
    TargetMarshaller.prototype._class += " marshaller_TargetMarshaller";

    TargetMarshaller.prototype.publish("configObject", {}, "object", "TargetMarshaller setup object", null, { tags: ["Basic"] });
    

    TargetMarshaller.prototype.content = function () {
        return [];
    };

    TargetMarshaller.prototype.populateContent = function () {
        var _configObject = this.configObject();
        for (var key in this._ddlDashboards) {
            this._ddlDashboards[key].visualizations.forEach(function (viz, idx) {
                var widget_config = _configObject[viz.id];
                if (widget_config !== undefined) {
                    if (widget_config.target !== undefined) {
                        viz.newWidgetSurface.target(widget_config.target);
                    } else {
                        console.log("Target not specified for the following:");
                        console.log("this._ddlDashboards[" + key + "].visualizations[" + idx + "].id = " + viz.id);
                    }
                    if (typeof widget_config.callback === "function") {
                        widget_config.callback(viz.widget, viz.newWidgetSurface);
                    } else {
                        console.warn("Callback not specified for the following:");
                        console.log("this._ddlDashboards[" + key + "].visualizations[" + idx + "].id = " + viz.id);
                    }
                } else {
                    console.warn("Config not specified for the following:");
                    console.log("this._ddlDashboards[" + key + "].visualizations[" + idx + "].id = " + viz.id);
                }
            }, this);
        }
    };

    TargetMarshaller.prototype.enter = function (domNode, element) {
        HTMLWidget.prototype.enter.apply(this, arguments);
    };

    TargetMarshaller.prototype.render = function (callback) {
        this.marshallerRender(HTMLWidget.prototype, callback);
        return this;
    };

    TargetMarshaller.prototype.commsError = function (source, error) {
        alert("Comms Error:\n" + source + "\n" + error);
    };

    return TargetMarshaller;
}));


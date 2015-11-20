/***
  * ExplorerSearches - Explorer searches components.
  * @version v0.0.1-SNAPSHOT
  * @link http://www.ga.gov.au/
  * @license Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
  */
/// <reference path="../../../typings/tsd.d.ts" />
/**
 * This package is to handle the artefacts produced by the search events indirectly.
 * There is no reason that it could be used for other like packages.
 */
var CesiumDrawing;
(function (CesiumDrawing) {
    function drawingFactory(viewer, data) {
        var type = DataType[data.type];
        if (type == DataType.GeoJSONPoint) {
            return new MapLabel(viewer, data, null);
        }
        else if (type == DataType.GeoJSONUrl) {
            return new GeoJsonDraper(viewer, data, null);
        }
        return null;
    }
    CesiumDrawing.drawingFactory = drawingFactory;
    (function (DataType) {
        DataType[DataType["GeoJSONPoint"] = 0] = "GeoJSONPoint";
        DataType[DataType["GeoJSONUrl"] = 1] = "GeoJSONUrl";
    })(CesiumDrawing.DataType || (CesiumDrawing.DataType = {}));
    var DataType = CesiumDrawing.DataType;
    ;
    var GeoJsonDraper = (function () {
        function GeoJsonDraper(viewer, data, options) {
            this.scene = viewer.scene;
            this.data = data;
            this.options = options;
        }
        GeoJsonDraper.prototype.draw = function () {
            var _this = this;
            this.primitiveCollection = new Cesium.PrimitiveCollection();
            Cesium.GeoJsonDataSource.load(this.data.url).then(function (dataSource) {
                var primitiveArr = [];
                for (var i = 0; i < dataSource.entities.values.length; i++) {
                    var _entity = dataSource.entities.values[i];
                    var _geometry;
                    if (_entity.polygon !== undefined) {
                        _geometry = new Cesium.PolygonGeometry({
                            polygonHierarchy: _entity.polygon.hierarchy._value
                        });
                    }
                    if (_entity.polyline !== undefined) {
                        _geometry = new Cesium.PolygonGeometry({
                            polygonHierarchy: {
                                positions: _entity.polyline.positions._value
                            }
                        });
                    }
                    if (!_geometry) {
                        continue;
                    }
                    var _geometryInstance = new Cesium.GeometryInstance({
                        geometry: _geometry,
                        id: 'instance',
                        attributes: {
                            color: new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 1.0, 0.3)
                        }
                    });
                    var primitive = new Cesium.GroundPrimitive({
                        geometryInstance: _geometryInstance,
                        appearance: new Cesium.PerInstanceColorAppearance({
                            translucent: false,
                            closed: true
                        })
                    });
                    _this.primitiveCollection.add(primitive);
                }
                _this.scene.primitives.add(_this.primitiveCollection);
            }).otherwise(function (error) {
                //Display any errrors encountered while loading.
                window.alert(error);
            });
        };
        GeoJsonDraper.prototype.erase = function () {
            if (this.scene && this.primitiveCollection) {
                this.scene.primitives.remove(this.primitiveCollection);
                this.primitiveCollection = null;
            }
        };
        GeoJsonDraper.prototype.destroy = function () {
            this.erase();
            this.scene = this.data = null;
        };
        GeoJsonDraper.prototype.isDrawn = function () {
            return !this.primitiveCollection;
        };
        return GeoJsonDraper;
    })();
    CesiumDrawing.GeoJsonDraper = GeoJsonDraper;
    var MapLabel = (function () {
        function MapLabel(viewer, data, options) {
            this.entities = null;
            this.options = {};
            if (options) {
                this.options = options;
            }
            this.viewer = viewer;
            this.container = data;
        }
        MapLabel.prototype.draw = function () {
            var coordinates = this.container.data.geometry.coordinates;
            this.erase();
            this.entities = this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(coordinates[1], coordinates[0]),
                point: {
                    pixelSize: 4,
                    color: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2
                },
                label: {
                    text: this.container.data.properties.name,
                    font: '16px Helvetica',
                    fillColor: Cesium.Color.BLACK,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                    pixelOffset: new Cesium.Cartesian2(10, 0)
                }
            });
        };
        MapLabel.prototype.isDrawn = function () {
            return this.entities != null;
        };
        MapLabel.prototype.erase = function () {
            if (this.entities) {
                this.viewer.entities.remove(this.entities);
                this.entities = null;
            }
        };
        MapLabel.prototype.destroy = function () {
            this.erase();
        };
        return MapLabel;
    })();
    CesiumDrawing.MapLabel = MapLabel;
})(CesiumDrawing || (CesiumDrawing = {}));
(function (angular) {
    'use strict';
    angular.module('exp.search.map.service', [])
        .factory('searchMapService', ['viewerService', function (viewerService) {
            var viewer = null;
            viewerService.getViewer(function (cesiumViewer) {
                viewer = cesiumViewer;
            });
            return {
                getDrawer: function (search) {
                    return CesiumDrawing.drawingFactory(viewer, search);
                },
                goTo: function (polygon) {
                    var xMax = -1000;
                    var xMin = 1000;
                    var yMin = 1000;
                    var yMax = 1000;
                    if (polygon.coordinates) {
                        polygon.coordinates.forEach(function (value) {
                            if (value) {
                                value.forEach(function (position) {
                                    if (position[0] > xMax) {
                                        xMax = position[0];
                                    }
                                    if (position[0] < xMin) {
                                        xMin = position[0];
                                    }
                                    if (position[1] > yMax) {
                                        yMax = position[1];
                                    }
                                    if (position[1] < yMin) {
                                        yMin = position[1];
                                    }
                                });
                            }
                        });
                    }
                    viewerService.goTo({
                        maxBounds: [
                            [yMin, xMin],
                            [yMax, xMax]
                        ],
                        animate: true
                    });
                }
            };
        }]);
})(angular);
angular.module("exp.search.templates", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("searches/basinsearch/basinsearch.html", "<div class=\"btn-group pull-left radSearch\" style=\"position:relative;width:27em;opacity:0.9\">\r\n	<div class=\"input-group\" style=\"width:100%;\">\r\n		<input type=\"text\" size=\"32\" class=\"form-control\" style=\"border-top-right-radius:4px;border-bottom-right-radius:4px;\" \r\n				ng-keyup=\"keyup($event)\" ng-focus=\"changing()\" ng-model=\"nameFilter\" placeholder=\"Find a basin of interest\">\r\n		<div class=\"input-group-btn\"></div>\r\n	</div>\r\n	<div style=\"width:26em; position:absolute;left:15px\">	\r\n		<div class=\"row\" ng-repeat=\"region in basinData.basins | basinFilterList : nameFilter : 10 | orderBy : \'name\'\" \r\n				style=\"background-color:white;\">\r\n			<div class=\"col-md-12 rw-sub-list-trigger\">\r\n				<button class=\"undecorated zoomButton\" ng-click=\"zoomToLocation(region);\">{{region.name}}</button>\r\n			</div>	\r\n		</div>\r\n	</div>\r\n</div>");
        $templateCache.put("searches/geosearch/geosearch.html", "<div class=\"btn-group pull-left radSearch\" style=\"width:27em;opacity:0.9\">\r\n	<div class=\"input-group\">\r\n		<input type=\"text\" ng-autocomplete ng-model=\"values.from.description\" options=\'{country:\"au\"}\'\r\n					size=\"32\" title=\"Select a locality to pan the map to.\" class=\"form-control\" aria-label=\"...\">\r\n		<div class=\"input-group-btn\">\r\n			<button ng-click=\"zoom(false)\" exp-ga=\"[\'send\', \'event\', \'radwaste\', \'click\', \'zoom to location\']\"\r\n				class=\"btn btn-default\"\r\n				title=\"Pan and potentially zoom to location.\"><i class=\"fa fa-search\"></i></button>\r\n		</div>\r\n	</div>\r\n</div>");
        $templateCache.put("searches/lastsearch/lastsearch.html", "<div style=\"padding:3px;padding-left:10px;position:relative\" ng-class-even=\"\'even\'\" ng-class-odd=\"\'active\'\">\r\n	<div class=\"pull-left\">\r\n			<div style=\"font-size:120%;padding-bottom:7px\">Result from: {{data.search.from}}</div>\r\n			<div ng-if=\"data.search.type == \'GeoJSONPoint\'\">\r\n				{{data.search.name}} (Lat {{data.search.data.geometry.coordinates[0] | number : 5}}&#176; Lng  {{data.search.data.geometry.coordinates[1] | number : 5}}&#176;)\r\n			</div>\r\n			<div ng-if=\"data.search.type == \'GeoJSONUrl\'\">\r\n				{{data.search.name}} \r\n			</div>\r\n			<div class=\"pull-right\">\r\n				<button class=\"undecorated\" ng-click=\"dismiss()\">\r\n					<i class=\"fa fa-cross\"></i>\r\n				</button>\r\n			</div>\r\n	</div>\r\n	<div style=\"padding-left:10px\" class=\"pull-right\">\r\n		<button class=\"undecorated\" class=\"featureLink\" title=\"Show on map\" \r\n			ng-click=\"toggle()\"><i class=\"fa fa-lg\" ng-class=\"{\'fa-eye-slash\':(!data.search.displayed), \'fa-eye\':data.search.displayed}\"></i></button>\r\n		<button class=\"undecorated\" class=\"featureLink\" title=\"Pan map to region\" \r\n			ng-click=\"pan()\"><i class=\"fa fa-flag fa-lg\"></i></button>							\r\n		<button class=\"undecorated\" class=\"featureLink\" title=\"Clear search/New search\" \r\n			ng-click=\"close()\"><i class=\"fa fa-close fa-lg\"></i></button>							\r\n	</div>\r\n</div>\r\n");
        $templateCache.put("searches/searches/searches.html", "<div class=\"searchesContainer\">\r\n	<div ng-hide=\"data.search\">\r\n		<span class=\"searchesItems\" ng-transclude></span>\r\n		<span class=\"dropdown clearfix\">\r\n			<div class=\"btn-group\" role=\"group\">\r\n				<div class=\"btn-group\" role=\"group\">\r\n					<button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"searchesDropdownMenu3\" \r\n							tooltip=\"Chane search type\" tooltip-append-to-body=\"true\"\r\n							data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">\r\n		      			<i class=\"fa fa-align-justify\"></i>\r\n   					</button>\r\n   					<ul class=\"dropdown-menu\" aria-labelledby=\"searchesDropdownMenu3\">\r\n	    	    		<li ng-repeat=\"search in state.searches\"><button class=\"undecorated\" ng-click=\"switch(search)\" ng-class=\"{searchesStrong:search.active}\">{{search.label}}</button></li>\r\n   					</ul>\r\n   				</div>\r\n   			</div>\r\n		</span>\r\n	</div>\r\n	<div class=\"searchesLastSearchContainer\" exp-last-search ng-show=\"data.search\"></div>\r\n</div>");
        $templateCache.put("searches/lgasearch/lgasearch.html", "<div class=\"btn-group pull-left radSearch\" style=\"position:relative;width:27em;opacity:0.9\">\r\n	<div class=\"input-group\" style=\"width:100%;\">\r\n		<input type=\"text\" size=\"32\" class=\"form-control\" style=\"border-top-right-radius:4px;border-bottom-right-radius:4px;\" \r\n				ng-keyup=\"keyup($event)\" ng-focus=\"changing()\" ng-model=\"nameFilter\" placeholder=\"Find a state or local government area\">\r\n		<div class=\"input-group-btn\"></div>\r\n	</div>\r\n	<div style=\"width:26em; position:absolute;left:15px\">	\r\n		<div class=\"lgaLists\">\r\n			<div class=\"row stateList includeMe\" ng-repeat=\"state in lgaData.states | lgaFilterList : nameFilter | orderBy : \'name\'\" \r\n					style=\"background-color:white;\">\r\n				<div class=\"col-md-12 \">\r\n					<button class=\"undecorated zoomButton\" ng-click=\"zoomToLocation(state);\">{{state.name}}</button>\r\n				</div>\r\n			</div>	\r\n		</div>\r\n		<div class=\"row\" ng-repeat=\"region in lgaData.lgas | lgaFilterList : nameFilter : 10 | orderBy : \'name\'\" \r\n				style=\"background-color:white;\">\r\n			<div class=\"col-md-12 rw-sub-list-trigger\">\r\n				<button class=\"undecorated zoomButton\" ng-click=\"zoomToLocation(region);\">{{region.name}}</button>\r\n			</div>	\r\n		</div>\r\n	</div>\r\n</div>");
    }]);

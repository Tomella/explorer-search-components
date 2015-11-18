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

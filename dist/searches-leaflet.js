/***
  * ExplorerSearches - Explorer searches components.
  * @version v0.0.1-SNAPSHOT
  * @link http://www.ga.gov.au/
  * @license Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
  */
  
  /// <reference path="../../../typings/tsd.d.ts" />
/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
(function (angular, L) {
    'use strict';
    angular.module('exp.search.map.service', [])
        .factory('searchMapService', ['$timeout', 'mapService', function ($timeout, mapService) {
            var map = null, statesUrl = "resources/config/states.json", lgasUrl = "resources/config/lgas.json", lgaShapeUrl = "service/area/lga/", lgaData = {}, lgaTimeout, lgaLayer, lgaFadeLayer;
            mapService.getMap(function (leafletMap) {
                map = leafletMap;
            });
            return {
                getDrawer: function (search) {
                    return null; //CesiumDrawing.drawingFactory(viewer, search);
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
                    mapService.getMap().then(function (map) {
                        map.fitBounds([
                            [yMin, xMin],
                            [yMax, xMax]
                        ]);
                    });
                }
            };
        }]);
})(angular, L);

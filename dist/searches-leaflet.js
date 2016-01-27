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
var Drawing;
(function (Drawing) {
    (function (DataType) {
        DataType[DataType["GeoJSONPoint"] = 0] = "GeoJSONPoint";
        DataType[DataType["GeoJSONUrl"] = 1] = "GeoJSONUrl";
    })(Drawing.DataType || (Drawing.DataType = {}));
    var DataType = Drawing.DataType;
    ;
    var GeoJsonUrlHandler = (function () {
        function GeoJsonUrlHandler(map, data, options) {
            this.map = map;
            this.data = data;
            this.options = options;
        }
        GeoJsonUrlHandler.prototype.draw = function () {
            var _this = this;
            var opacity = 1;
            var fade = function () {
                opacity -= 0.05;
                if (opacity <= 0) {
                    _this.map.removeLayer(_this.fadeLayer);
                }
                else {
                    _this.fadeLayer.setStyle({ opacity: opacity });
                    _this.timeout = _this.options.$timeout(fade, 1000);
                }
            };
            if (this.fadeLayer) {
                this.options.$timeout.cancel(this.timeout);
                this.map.removeLayer(this.fadeLayer);
            }
            this.options.$http.get(this.data.url).then(function (response) {
                this.fadeLayer = L.geoJson(response.data, {
                    clickable: false,
                    style: function (feature) {
                        return {
                            color: "red",
                            opacity: 1
                        };
                    }
                }).addTo(this.map);
                this.timeout = this.options.$timeout(fade, 5000);
            }.bind(this));
        };
        GeoJsonUrlHandler.prototype.erase = function () {
            if (this.map && this.fadeLayer) {
                this.map.removeLayer(this.fadeLayer);
                this.fadeLayer = null;
            }
        };
        GeoJsonUrlHandler.prototype.destroy = function () {
            this.erase();
            this.map = this.data = null;
        };
        GeoJsonUrlHandler.prototype.isDrawn = function () {
            return !this.fadeLayer;
        };
        return GeoJsonUrlHandler;
    })();
    Drawing.GeoJsonUrlHandler = GeoJsonUrlHandler;
    // TODO: No one has asked for it yet. 
    var GeoJsonPointHandler = (function () {
        function GeoJsonPointHandler(viewer, data, options) {
            this.entities = null;
            this.options = {};
            if (options) {
                this.options = options;
            }
            this.viewer = viewer;
            this.container = data;
        }
        GeoJsonPointHandler.prototype.draw = function () {
            // Tadah
        };
        GeoJsonPointHandler.prototype.isDrawn = function () {
            return false;
        };
        GeoJsonPointHandler.prototype.erase = function () {
        };
        GeoJsonPointHandler.prototype.destroy = function () {
            this.erase();
        };
        return GeoJsonPointHandler;
    })();
    Drawing.GeoJsonPointHandler = GeoJsonPointHandler;
})(Drawing || (Drawing = {}));
(function (angular, L) {
    'use strict';
    angular.module('exp.search.map.service', [])
        .factory('searchMapService', ['$http', '$timeout', 'mapService', function ($http, $timeout, mapService) {
            var map = null, statesUrl = "resources/config/states.json", lgasUrl = "resources/config/lgas.json", lgaShapeUrl = "service/area/lga/", lgaData = {}, lgaTimeout, lgaLayer, lgaFadeLayer;
            mapService.getMap().then(function (leafletMap) {
                map = leafletMap;
            });
            return {
                getDrawer: function (search) {
                    return drawingFactory(map, search);
                },
                goTo: function (polygon) {
                    var xMax = -1000;
                    var xMin = 1000;
                    var yMin = 1000;
                    var yMax = -1000;
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
            function drawingFactory(map, search) {
                var options = {
                    $timeout: $timeout,
                    $http: $http
                };
                if (search.type == "GeoJSONUrl") {
                    return new Drawing.GeoJsonUrlHandler(map, search, options);
                }
                else if (search.type == "GeoJSONPoint") {
                    return new Drawing.GeoJsonPointHandler(map, search, options);
                }
            }
        }]);
})(angular, L);
angular.module("exp.search.templates", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("searches/basinsearch/basinsearch.html", "<div class=\"btn-group pull-left radSearch\" style=\"position:relative;width:27em;opacity:0.9\">\r\n	<div class=\"input-group\" style=\"width:100%;\">\r\n		<input type=\"text\" size=\"32\" class=\"form-control\" style=\"border-top-right-radius:4px;border-bottom-right-radius:4px;\" \r\n				ng-keyup=\"keyup($event)\" ng-focus=\"changing()\" ng-model=\"nameFilter\" placeholder=\"Find a basin of interest\">\r\n		<div class=\"input-group-btn\"></div>\r\n	</div>\r\n	<div style=\"width:26em; position:absolute;left:15px\">	\r\n		<div class=\"row\" ng-repeat=\"region in basinData.basins | basinFilterList : nameFilter : 10 | orderBy : \'name\'\" \r\n				style=\"background-color:white;\">\r\n			<div class=\"col-md-12 rw-sub-list-trigger\">\r\n				<button class=\"undecorated zoomButton\" ng-click=\"zoomToLocation(region);\">{{region.name}}</button>\r\n			</div>	\r\n		</div>\r\n	</div>\r\n</div>");
        $templateCache.put("searches/geosearch/geosearch.html", "<div class=\"btn-group pull-left radSearch\" style=\"width:27em;opacity:0.9\">\r\n	<div class=\"input-group\">\r\n		<input type=\"text\" ng-autocomplete ng-model=\"values.from.description\" options=\'{country:\"au\"}\'\r\n					size=\"32\" title=\"Select a locality to pan the map to.\" class=\"form-control\" aria-label=\"...\">\r\n		<div class=\"input-group-btn\">\r\n			<button ng-click=\"zoom(false)\" exp-ga=\"[\'send\', \'event\', \'radwaste\', \'click\', \'zoom to location\']\"\r\n				class=\"btn btn-default\"\r\n				title=\"Pan and potentially zoom to location.\"><i class=\"fa fa-search\"></i></button>\r\n		</div>\r\n	</div>\r\n</div>");
        $templateCache.put("searches/lgasearch/lgasearch.html", "<div class=\"btn-group pull-left radSearch\" style=\"position:relative;width:27em;opacity:0.9\">\r\n	<div class=\"input-group\" style=\"width:100%;\">\r\n		<input type=\"text\" size=\"32\" class=\"form-control\" style=\"border-top-right-radius:4px;border-bottom-right-radius:4px;\" \r\n				ng-keyup=\"keyup($event)\" ng-focus=\"changing()\" ng-model=\"nameFilter\" placeholder=\"Find a state or local government area\">\r\n		<div class=\"input-group-btn\"></div>\r\n	</div>\r\n	<div style=\"width:26em; position:absolute;left:15px\">	\r\n		<div class=\"lgaLists\">\r\n			<div class=\"row stateList includeMe\" ng-repeat=\"state in lgaData.states | lgaFilterList : nameFilter | orderBy : \'name\'\" \r\n					style=\"background-color:white;\">\r\n				<div class=\"col-md-12 \">\r\n					<button class=\"undecorated zoomButton\" ng-click=\"zoomToLocation(state);\">{{state.name}}</button>\r\n				</div>\r\n			</div>	\r\n		</div>\r\n		<div class=\"row\" ng-repeat=\"region in lgaData.lgas | lgaFilterList : nameFilter : 10 | orderBy : \'name\'\" \r\n				style=\"background-color:white;\">\r\n			<div class=\"col-md-12 rw-sub-list-trigger\">\r\n				<button class=\"undecorated zoomButton\" ng-click=\"zoomToLocation(region);\">{{region.name}}</button>\r\n			</div>	\r\n		</div>\r\n	</div>\r\n</div>");
        $templateCache.put("searches/lastsearch/lastsearch.html", "<div style=\"padding:3px;padding-left:10px;position:relative\" ng-class-even=\"\'even\'\" ng-class-odd=\"\'active\'\">\r\n	<div class=\"pull-left\">\r\n			<div style=\"font-size:120%;padding-bottom:7px\">Result from: {{data.search.from}}</div>\r\n			<div ng-if=\"data.search.type == \'GeoJSONPoint\'\">\r\n				{{data.search.name}} (Lat {{data.search.data.geometry.coordinates[0] | number : 5}}&#176; Lng  {{data.search.data.geometry.coordinates[1] | number : 5}}&#176;)\r\n			</div>\r\n			<div ng-if=\"data.search.type == \'GeoJSONUrl\'\">\r\n				{{data.search.name}} \r\n			</div>\r\n			<div class=\"pull-right\">\r\n				<button class=\"undecorated\" ng-click=\"dismiss()\">\r\n					<i class=\"fa fa-cross\"></i>\r\n				</button>\r\n			</div>\r\n	</div>\r\n	<div style=\"padding-left:10px\" class=\"pull-right\">\r\n		<button class=\"undecorated\" class=\"featureLink\" title=\"Show on map\" \r\n			ng-click=\"toggle()\"><i class=\"fa fa-lg\" ng-class=\"{\'fa-eye-slash\':(!data.search.displayed), \'fa-eye\':data.search.displayed}\"></i></button>\r\n		<button class=\"undecorated\" class=\"featureLink\" title=\"Pan map to region\" \r\n			ng-click=\"pan()\"><i class=\"fa fa-flag fa-lg\"></i></button>							\r\n		<button class=\"undecorated\" class=\"featureLink\" title=\"Clear search/New search\" \r\n			ng-click=\"close()\"><i class=\"fa fa-close fa-lg\"></i></button>							\r\n	</div>\r\n</div>\r\n");
        $templateCache.put("searches/searches/searches.html", "<div class=\"searchesContainer\">\r\n	<div ng-hide=\"data.search\">\r\n		<span class=\"searchesItems\" ng-transclude></span>\r\n		<span class=\"dropdown clearfix\">\r\n			<div class=\"btn-group\" role=\"group\">\r\n				<div class=\"btn-group\" role=\"group\">\r\n					<button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"searchesDropdownMenu3\" \r\n							tooltip=\"Change search type\" tooltip-append-to-body=\"true\"\r\n							data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">\r\n		      			<i class=\"fa fa-align-justify\"></i>\r\n   					</button>\r\n   					<ul class=\"dropdown-menu\" aria-labelledby=\"searchesDropdownMenu3\">\r\n	    	    		<li ng-repeat=\"search in state.searches\"><button class=\"undecorated\" ng-click=\"switch(search)\" ng-class=\"{searchesStrong:search.active}\">{{search.label}}</button></li>\r\n   					</ul>\r\n   				</div>\r\n   			</div>\r\n		</span>\r\n	</div>\r\n	<div class=\"searchesLastSearchContainer\" exp-last-search ng-show=\"data.search\"></div>\r\n</div>");
    }]);

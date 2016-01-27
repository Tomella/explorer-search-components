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
(function (angular) {
    'use strict';
    angular.module("exp.search.basinsearch", ['exp.search.map.service'])
        .directive("basinSearch", ['$log', '$timeout', 'basinService', function ($log, $timeout, basinService) {
            return {
                restrict: "AE",
                transclude: true,
                templateUrl: "searches/basinsearch/basinsearch.html",
                link: function (scope, element) {
                    var timeout;
                    basinService.load().then(function (data) {
                        scope.basinData = data;
                    });
                    scope.changing = function () {
                        $log.info("Cancel close");
                        $timeout.cancel(timeout);
                    };
                    scope.cancel = cancel;
                    scope.zoomToLocation = function (region) {
                        basinService.zoomToLocation(region);
                        cancel();
                    };
                    function cancel() {
                        $timeout.cancel(timeout);
                        timeout = $timeout(function () {
                            $log.info("Clear filter");
                            scope.nameFilter = "";
                        }, 7000);
                    }
                }
            };
        }])
        .provider("basinService", BasinsearchServiceProvider)
        .filter("basinFilterList", function () {
        return function (list, filter, max) {
            var response = [], lowerFilter, count;
            if (!filter) {
                return response;
            }
            if (!max) {
                max = 50;
            }
            lowerFilter = filter.toLowerCase();
            if (list) {
                count = 0;
                list.some(function (item) {
                    if (item.name.toLowerCase().indexOf(lowerFilter) > -1) {
                        response.push(item);
                        count++;
                    }
                    return count > max;
                });
            }
            return response;
        };
    });
    function BasinsearchServiceProvider() {
        var basinsUrl = "service/basinsearch/basins", basinShapeUrl = "service/basinsearch/basin/", baseUrl = '', basinData = {};
        this.setReferenceUrl = function (url) {
            basinsUrl = url;
        };
        this.setShapeUrl = function (url) {
            basinShapeUrl = url;
        };
        this.setBaseUrl = function (url) {
            baseUrl = url;
        };
        this.$get = ['$q', '$rootScope', '$timeout', 'httpData', 'searchMapService',
            function basinServiceFactory($q, $rootScope, $timeout, httpData, searchMapService) {
                var service = {
                    load: function () {
                        return httpData.get(baseUrl + basinsUrl, { cache: true }).then(function (response) {
                            basinData.basins = response.data.basins;
                            return basinData;
                        });
                    },
                    zoomToLocation: function (region) {
                        var bbox = region.bbox;
                        var polygon = {
                            type: "Polygon",
                            coordinates: [[
                                    [bbox.xMin, bbox.yMin],
                                    [bbox.xMin, bbox.yMax],
                                    [bbox.xMax, bbox.yMax],
                                    [bbox.xMax, bbox.yMin],
                                    [bbox.xMin, bbox.yMin]
                                ]]
                        };
                        var broadcastData = {
                            from: "Basins search",
                            type: "GeoJSONUrl",
                            url: baseUrl + basinShapeUrl + region.id,
                            pan: pan,
                            show: true,
                            name: region.name,
                            polygon: polygon
                        };
                        $rootScope.$broadcast('search.performed', broadcastData);
                        pan();
                        function pan() {
                            searchMapService.goTo(polygon);
                        }
                    }
                };
                return service;
            }];
    }
})(angular);
/// <reference path="../../../typings/tsd.d.ts" />
/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
(function (angular) {
    'use strict';
    /*
     * Wiring
     */
    angular.module('exp.search.lastsearch', [])
        .directive('expLastSearch', ['$document', 'lastSearchService',
        function ($document, lastSearchService) {
            return {
                restrict: 'AE',
                transclude: true,
                templateUrl: 'searches/lastsearch/lastsearch.html',
                link: function (scope, element) {
                    scope.data = lastSearchService.data();
                    $document.on("keyup", keyupHandler);
                    scope.toggle = function () {
                        if ((scope.data.search.displayed = !scope.data.search.displayed)) {
                            lastSearchService.show();
                        }
                        else {
                            lastSearchService.hide();
                        }
                    };
                    scope.pan = function () {
                        scope.data.search.pan();
                    };
                    scope.close = function () {
                        lastSearchService.clear();
                    };
                    function keyupHandler(keyEvent) {
                        if (keyEvent.which == 27) {
                            keyEvent.stopPropagation();
                            keyEvent.preventDefault();
                            scope.$apply(function () {
                                scope.close();
                            });
                        }
                    }
                }
            };
        }])
        .provider('lastSearchService', [function () {
            var listen = true;
            this.noListen = function () {
                listen = false;
            };
            this.$get = ['$log', '$rootScope', 'searchMapService', function ($log, $rootScope, searchMapService) {
                    var data = {
                        search: null
                    };
                    var drawing;
                    var service = {
                        show: function () {
                            drawing.draw();
                        },
                        hide: function () {
                            if (drawing) {
                                drawing.erase();
                            }
                        },
                        data: function () {
                            return data;
                        },
                        isShowing: function () {
                            drawing.isDrawn();
                        },
                        clear: function () {
                            this.hide();
                            data.search = null;
                        }
                    };
                    $rootScope.$on('search.performed', listener);
                    function listener(event, search) {
                        if (drawing) {
                            drawing.destroy();
                        }
                        drawing = searchMapService.getDrawer(search);
                        if (listen) {
                            data.search = search;
                        }
                        if (search.show) {
                            search.displayed = true;
                            drawing.draw();
                        }
                    }
                    ;
                    return service;
                }];
        }]);
})(angular);
/// <reference path="../../../typings/tsd.d.ts" />
(function (angular, google) {
    'use strict';
    angular.module('exp.search.geosearch', ['ngAutocomplete'])
        .directive('geoSearch', ['$log', '$q', '$rootScope', 'googleService', 'searchMapService',
        function ($log, $q, $rootScope, googleService, searchMapService) {
            var SPREAD_DEGREES = 0.1;
            return {
                templateUrl: 'searches/geosearch/geosearch.html',
                controller: ['$scope', function ($scope) {
                        // Place holders for the google response.
                        $scope.values = {
                            from: {}
                        };
                        $scope.zoom = function (marker) {
                            var promise, promises = [];
                            if (!$scope.values.from.description) {
                                return;
                            }
                            googleService.getAddressDetails($scope.values.from.description, $scope).then(function (results) {
                                var feature = {
                                    type: 'Feature',
                                    geometry: {
                                        type: 'Point',
                                        coordinates: [results.lat, results.lon],
                                    },
                                    properties: {
                                        name: results.address
                                    }
                                };
                                var broadcastData = {
                                    from: "Google search",
                                    name: results.address,
                                    type: "GeoJSONPoint",
                                    pan: function () {
                                        pan();
                                    },
                                    data: feature
                                };
                                var xMin = results.lon - SPREAD_DEGREES;
                                var xMax = results.lon + SPREAD_DEGREES;
                                var yMin = results.lat - SPREAD_DEGREES;
                                var yMax = results.lat + SPREAD_DEGREES;
                                var polygon = {
                                    type: "Polygon",
                                    coordinates: [[
                                            [xMin, yMin],
                                            [xMin, yMax],
                                            [xMax, yMax],
                                            [xMax, yMin],
                                            [xMin, yMin]
                                        ]]
                                };
                                $log.debug('Received the results for from');
                                $scope.values.from.results = results;
                                if (results) {
                                    pan();
                                    $rootScope.$broadcast('search.performed', broadcastData);
                                }
                                // Hide the dialog.
                                $scope.item = '';
                                return results;
                                function pan() {
                                    searchMapService.goTo(polygon);
                                }
                            }, function (error) {
                                $log.debug('Failed to complete the from lookup.');
                            });
                        };
                    }]
            };
        }])
        .factory('googleService', ['$log', '$q', function ($log, $q) {
            var geocoder = new google.maps.Geocoder(), service;
            try {
                service = new google.maps.places.AutocompleteService(null, {
                    types: ['geocode']
                });
            }
            catch (e) {
                $log.debug("Catching google error that manifests itself when debugging in Firefox only");
            }
            return {
                getAddressDetails: function (address, digester) {
                    var deferred = $q.defer();
                    geocoder.geocode({ address: address, region: "au" }, function (results, status) {
                        if (status != google.maps.GeocoderStatus.OK) {
                            digester.$apply(function () {
                                deferred.reject("Failed to find address");
                            });
                        }
                        else {
                            digester.$apply(function () {
                                deferred.resolve({
                                    lat: results[0].geometry.location.lat(),
                                    lon: results[0].geometry.location.lng(),
                                    address: results[0].formatted_address
                                });
                            });
                        }
                    });
                    return deferred.promise;
                }
            };
        }]);
})(angular, google);
/// <reference path="../../../typings/tsd.d.ts" />
/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
(function (angular) {
    'use strict';
    angular.module("exp.search.lgasearch", [])
        .directive("lgaSearch", ['$log', '$timeout', 'lgaService', function ($log, $timeout, lgaService) {
            return {
                restrict: "AE",
                transclude: true,
                templateUrl: "searches/lgasearch/lgasearch.html",
                link: function (scope, element) {
                    var timeout;
                    lgaService.load().then(function (data) {
                        scope.lgaData = data;
                    });
                    scope.changing = function () {
                        $log.info("Cancel close");
                        $timeout.cancel(timeout);
                    };
                    scope.cancel = cancel;
                    scope.zoomToLocation = function (region) {
                        lgaService.zoomToLocation(region);
                        cancel();
                    };
                    function cancel() {
                        $timeout.cancel(timeout);
                        timeout = $timeout(function () {
                            $log.info("Clear filter");
                            scope.nameFilter = "";
                        }, 7000);
                    }
                }
            };
        }])
        .provider("lgaService", LgasearchServiceProvider)
        .filter("lgaFilterList", function () {
        return function (list, filter, max) {
            var response = [], lowerFilter, count;
            if (!filter) {
                return response;
            }
            if (!max) {
                max = 50;
            }
            lowerFilter = filter.toLowerCase();
            if (list) {
                count = 0;
                list.some(function (item) {
                    if (item.name.toLowerCase().indexOf(lowerFilter) > -1) {
                        response.push(item);
                        count++;
                    }
                    return count > max;
                });
            }
            return response;
        };
    });
    function LgasearchServiceProvider() {
        var statesUrl = "service/lgasearch/states", lgasUrl = "service/lgasearch/lgas", lgaShapeUrl = "/explorer-cossap-services/service/lgasearch/lga/", lgaData = {}, lgaTimeout, lgaLayer, lgaFadeLayer, removePrimitiveTimeout, scene;
        this.setReferenceUrl = function (url) {
            lgasUrl = url;
        };
        this.setShapeUrl = function (url) {
            lgaShapeUrl = url;
        };
        this.$get = ['$q', '$rootScope', '$timeout', 'httpData', 'searchMapService', function lgaServiceFactory($q, $rootScope, $timeout, httpData, searchMapService) {
                var service = {
                    load: function () {
                        httpData.get(lgasUrl, { cache: true }).then(function (response) {
                            lgaData.lgas = response.data.lgas;
                        });
                        httpData.get(statesUrl, { cache: true }).then(function (response) {
                            lgaData.states = response.data.states;
                        });
                        return $q.when(lgaData);
                    },
                    zoomToLocation: function (region) {
                        var bbox = region.bbox;
                        var polygon = {
                            type: "Polygon",
                            coordinates: [[
                                    [bbox.xMin, bbox.yMin],
                                    [bbox.xMin, bbox.yMax],
                                    [bbox.xMax, bbox.yMax],
                                    [bbox.xMax, bbox.yMin],
                                    [bbox.xMin, bbox.yMin]
                                ]]
                        };
                        var broadcastData = {
                            from: "LGA search",
                            type: "GeoJSONUrl",
                            url: lgaShapeUrl + region.id + '/geojson',
                            pan: pan,
                            show: true,
                            name: region.name,
                            polygon: polygon
                        };
                        if (region.id) {
                            $rootScope.$broadcast('search.performed', broadcastData);
                        }
                        pan();
                        function pan() {
                            searchMapService.goTo(polygon);
                        }
                    }
                };
                return service;
            }];
    }
})(angular);
/// <reference path="../../../typings/tsd.d.ts" />
/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
(function (angular) {
    'use strict';
    angular.module("exp.search.searches", ['exp.search.lastsearch'])
        .directive('searchSearches', function () {
        return {
            restrict: "AE",
            replace: true,
            transclude: true,
            templateUrl: 'searches/searches/searches.html',
            scope: {
                name: "@"
            },
            controller: ['$scope', function ($scope) {
                    $scope.state = {
                        showSearchButton: true,
                        searches: []
                    };
                    $scope.switch = function (data) {
                        activate(data);
                    };
                    this.add = function (data) {
                        console.log("Adding");
                        $scope.state.searches.push(data);
                    };
                    this.active = function (data) {
                        activate(data);
                    };
                    function activate(data) {
                        $scope.state.searches.forEach(function (item) {
                            item.active = false;
                        });
                        data.active = true;
                    }
                }]
        };
    })
        .directive('searchSearch', function () {
        return {
            replace: true,
            template: "<div ng-transclude ng-show='active'></div>",
            transclude: true,
            require: "^searchSearches",
            scope: {
                label: "@",
                active: "=default"
            },
            link: function (scope, element, attrs, ctrl) {
                ctrl.add(scope);
            }
        };
    });
})(angular);
angular.module("exp.search.templates", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("searches/basinsearch/basinsearch.html", "<div class=\"btn-group pull-left radSearch\" style=\"position:relative;width:27em;opacity:0.9\">\r\n	<div class=\"input-group\" style=\"width:100%;\">\r\n		<input type=\"text\" size=\"32\" class=\"form-control\" style=\"border-top-right-radius:4px;border-bottom-right-radius:4px;\" \r\n				ng-keyup=\"keyup($event)\" ng-focus=\"changing()\" ng-model=\"nameFilter\" placeholder=\"Find a basin of interest\">\r\n		<div class=\"input-group-btn\"></div>\r\n	</div>\r\n	<div style=\"width:26em; position:absolute;left:15px\">	\r\n		<div class=\"row\" ng-repeat=\"region in basinData.basins | basinFilterList : nameFilter : 10 | orderBy : \'name\'\" \r\n				style=\"background-color:white;\">\r\n			<div class=\"col-md-12 rw-sub-list-trigger\">\r\n				<button class=\"undecorated zoomButton\" ng-click=\"zoomToLocation(region);\">{{region.name}}</button>\r\n			</div>	\r\n		</div>\r\n	</div>\r\n</div>");
        $templateCache.put("searches/lastsearch/lastsearch.html", "<div style=\"padding:3px;padding-left:10px;position:relative\" ng-class-even=\"\'even\'\" ng-class-odd=\"\'active\'\">\r\n	<div class=\"pull-left\">\r\n			<div style=\"font-size:120%;padding-bottom:7px\">Result from: {{data.search.from}}</div>\r\n			<div ng-if=\"data.search.type == \'GeoJSONPoint\'\">\r\n				{{data.search.name}} (Lat {{data.search.data.geometry.coordinates[0] | number : 5}}&#176; Lng  {{data.search.data.geometry.coordinates[1] | number : 5}}&#176;)\r\n			</div>\r\n			<div ng-if=\"data.search.type == \'GeoJSONUrl\'\">\r\n				{{data.search.name}} \r\n			</div>\r\n			<div class=\"pull-right\">\r\n				<button class=\"undecorated\" ng-click=\"dismiss()\">\r\n					<i class=\"fa fa-cross\"></i>\r\n				</button>\r\n			</div>\r\n	</div>\r\n	<div style=\"padding-left:10px\" class=\"pull-right\">\r\n		<button class=\"undecorated\" class=\"featureLink\" title=\"Show on map\" \r\n			ng-click=\"toggle()\"><i class=\"fa fa-lg\" ng-class=\"{\'fa-eye-slash\':(!data.search.displayed), \'fa-eye\':data.search.displayed}\"></i></button>\r\n		<button class=\"undecorated\" class=\"featureLink\" title=\"Pan map to region\" \r\n			ng-click=\"pan()\"><i class=\"fa fa-flag fa-lg\"></i></button>							\r\n		<button class=\"undecorated\" class=\"featureLink\" title=\"Clear search/New search\" \r\n			ng-click=\"close()\"><i class=\"fa fa-close fa-lg\"></i></button>							\r\n	</div>\r\n</div>\r\n");
        $templateCache.put("searches/geosearch/geosearch.html", "<div class=\"btn-group pull-left radSearch\" style=\"width:27em;opacity:0.9\">\r\n	<div class=\"input-group\">\r\n		<input type=\"text\" ng-autocomplete ng-model=\"values.from.description\" options=\'{country:\"au\"}\'\r\n					size=\"32\" title=\"Select a locality to pan the map to.\" class=\"form-control\" aria-label=\"...\">\r\n		<div class=\"input-group-btn\">\r\n			<button ng-click=\"zoom(false)\" exp-ga=\"[\'send\', \'event\', \'radwaste\', \'click\', \'zoom to location\']\"\r\n				class=\"btn btn-default\"\r\n				title=\"Pan and potentially zoom to location.\"><i class=\"fa fa-search\"></i></button>\r\n		</div>\r\n	</div>\r\n</div>");
        $templateCache.put("searches/lgasearch/lgasearch.html", "<div class=\"btn-group pull-left radSearch\" style=\"position:relative;width:27em;opacity:0.9\">\r\n	<div class=\"input-group\" style=\"width:100%;\">\r\n		<input type=\"text\" size=\"32\" class=\"form-control\" style=\"border-top-right-radius:4px;border-bottom-right-radius:4px;\" \r\n				ng-keyup=\"keyup($event)\" ng-focus=\"changing()\" ng-model=\"nameFilter\" placeholder=\"Find a state or local government area\">\r\n		<div class=\"input-group-btn\"></div>\r\n	</div>\r\n	<div style=\"width:26em; position:absolute;left:15px\">	\r\n		<div class=\"lgaLists\">\r\n			<div class=\"row stateList includeMe\" ng-repeat=\"state in lgaData.states | lgaFilterList : nameFilter | orderBy : \'name\'\" \r\n					style=\"background-color:white;\">\r\n				<div class=\"col-md-12 \">\r\n					<button class=\"undecorated zoomButton\" ng-click=\"zoomToLocation(state);\">{{state.name}}</button>\r\n				</div>\r\n			</div>	\r\n		</div>\r\n		<div class=\"row\" ng-repeat=\"region in lgaData.lgas | lgaFilterList : nameFilter : 10 | orderBy : \'name\'\" \r\n				style=\"background-color:white;\">\r\n			<div class=\"col-md-12 rw-sub-list-trigger\">\r\n				<button class=\"undecorated zoomButton\" ng-click=\"zoomToLocation(region);\">{{region.name}}</button>\r\n			</div>	\r\n		</div>\r\n	</div>\r\n</div>");
        $templateCache.put("searches/searches/searches.html", "<div class=\"searchesContainer\">\r\n	<div ng-hide=\"data.search\">\r\n		<span class=\"searchesItems\" ng-transclude></span>\r\n		<span class=\"dropdown clearfix\">\r\n			<div class=\"btn-group\" role=\"group\">\r\n				<div class=\"btn-group\" role=\"group\">\r\n					<button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"searchesDropdownMenu3\" \r\n							tooltip=\"Change search type\" tooltip-append-to-body=\"true\"\r\n							data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">\r\n		      			<i class=\"fa fa-align-justify\"></i>\r\n   					</button>\r\n   					<ul class=\"dropdown-menu\" aria-labelledby=\"searchesDropdownMenu3\">\r\n	    	    		<li ng-repeat=\"search in state.searches\"><button class=\"undecorated\" ng-click=\"switch(search)\" ng-class=\"{searchesStrong:search.active}\">{{search.label}}</button></li>\r\n   					</ul>\r\n   				</div>\r\n   			</div>\r\n		</span>\r\n	</div>\r\n	<div class=\"searchesLastSearchContainer\" exp-last-search ng-show=\"data.search\"></div>\r\n</div>");
    }]);

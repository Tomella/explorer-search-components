/***
  * ExplorerSearches - Explorer searches components.
  * @version v0.0.1-SNAPSHOT
  * @link http://www.ga.gov.au/
  * @license Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
  */
/// <reference path="../../../typings/tsd.d.ts" />
(function (angular, Cesium) {
    'use strict';
    angular.module("exp.search.basinsearch", [])
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
        var basinsUrl = "service/basinsearch/basins", basinShapeUrl = "service/basinsearch/basin/", basinData = {};
        this.setReferenceUrl = function (url) {
            basinsUrl = url;
        };
        this.$get = ['$q', '$rootScope', '$timeout', 'httpData', 'searchMapService',
            function basinServiceFactory($q, $rootScope, $timeout, httpData, searchMapService) {
                var service = {
                    load: function () {
                        return httpData.get(basinsUrl, { cache: true }).then(function (response) {
                            basinData.basins = response.data.basins;
                            return basinData;
                        });
                    },
                    zoomToLocation: function (region) {
                        var bbox = region.bbox;
                        var polygon = {
                            type: "Polygon",
                            coordinates: [
                                [bbox.xMin, bbox.yMin],
                                [bbox.xMin, bbox.yMax],
                                [bbox.xMax, bbox.yMax],
                                [bbox.xMax, bbox.yMin],
                                [bbox.xMin, bbox.yMin]
                            ]
                        };
                        var broadcastData = {
                            from: "Basins search",
                            type: "GeoJSONUrl",
                            url: '/explorer-searches-services/service/basinsearch/basin/' + region.id,
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
})(angular, SearchMapping);
/// <reference path="../../../typings/tsd.d.ts" />
(function (angular, google, Cesium) {
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
})(angular, google, Cesium);
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
        .directive('geoLastSearch', ['$document', 'lastSearchService',
        function ($document, lastSearchService) {
            return {
                restrict: 'AE',
                transclude: true,
                templateUrl: 'searches/lastsearch/lastsearch.html',
                link: function (scope, element) {
                    scope.data = lastSearchService.data;
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
        .factory('lastSearchService', ['$log', '$rootScope', 'searchMapService', function ($log, $rootScope, searchMapService) {
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
            $rootScope.$on('search.performed', function (event, search) {
                if (drawing) {
                    drawing.destroy();
                }
                drawing = searchMapService.getDrawer(search);
                data.search = search;
                if (search.show) {
                    drawing.show();
                }
            });
            return service;
        }]);
})(angular);
/// <reference path="../../../typings/tsd.d.ts" />
/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
(function (angular, Cesium) {
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
        var statesUrl = "service/lgasearch/states", lgasUrl = "service/lgasearch/lgas", lgaShapeUrl = "service/lgasearch/lga/", lgaData = {}, lgaTimeout, lgaLayer, lgaFadeLayer, removePrimitiveTimeout, scene;
        this.setReferenceUrl = function (url) {
            lgasUrl = url;
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
                            coordinates: [
                                [bbox.xMin, bbox.yMin],
                                [bbox.xMin, bbox.yMax],
                                [bbox.xMax, bbox.yMax],
                                [bbox.xMax, bbox.yMin],
                                [bbox.xMin, bbox.yMin]
                            ]
                        };
                        var broadcastData = {
                            from: "LGA search",
                            type: "GeoJSONUrl",
                            url: '/explorer-searches-services/service/basinsearch/basin/' + region.id,
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
})(angular, Cesium);
/// <reference path="../../../typings/tsd.d.ts" />
/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
(function (angular) {
    'use strict';
    angular.module("exp.search.searches", [])
        .directive('searchesSearches', function () {
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
        .directive('searchesSearch', function () {
        return {
            replace: true,
            template: "<div ng-transclude ng-show='active'></div>",
            transclude: true,
            require: "^searchesSearches",
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

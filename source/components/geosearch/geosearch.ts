/// <reference path="../../../typings/index.d.ts" />

/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

declare var google: any;

interface IGeoSearchResults {
    address: string;
    lat: number;
    lon: number;
}

(function(angular: ng.IAngularStatic, google:any) {

'use strict';


angular.module('exp.search.geosearch', ['ngAutocomplete'])

.directive('geoSearch', ['$log', '$q', '$rootScope', 'googleService', 'searchMapService',
                       function($log : any, $q : any, $rootScope:any, googleService : any, searchMapService:any) {
    var SPREAD_DEGREES : number = 0.1;
    return {
        templateUrl : 'searches/geosearch/geosearch.html',
        controller:['$scope', function($scope : any) {
            // Place holders for the google response.
            $scope.values = {
                from:{}
            };

            $scope.zoom = function(marker : any) {
                var promise:any,
                    promises:any = [];

                if(!$scope.values.from.description) {
                    return;
                }

                googleService.getAddressDetails($scope.values.from.description, $scope).then(function(results: IGeoSearchResults) {
                    var feature: GeoJSON.Feature = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [results.lat, results.lon]
                        },
                        properties: {
                            name: results.address
                        }
                    };

                    var broadcastData: Searches.ISearchPerformed = {
                        from: "Google search",
                        name: results.address,
                        type: "GeoJSONPoint",
                        pan: function() {
                          pan();
                        },
                        data: feature
                    };
                    var xMin = results.lon - SPREAD_DEGREES;
                    var xMax = results.lon + SPREAD_DEGREES;
                    var yMin = results.lat - SPREAD_DEGREES;
                    var yMax = results.lat + SPREAD_DEGREES;

					var polygon: GeoJSON.Polygon = {
						type: "Polygon",
						coordinates: [[
							[xMin, yMin],
							[xMin, yMax],
							[xMax, yMax],
							[xMax, yMin],
							[xMin, yMin]
						]]
					};

                    function pan() {
                        searchMapService.goTo(polygon);
                    }

                    $log.debug('Received the results for from');
                    $scope.values.from.results = results;
                    if(results) {
                        pan();
                        $rootScope.$broadcast('search.performed', broadcastData);
                    }
                    // Hide the dialog.
                    $scope.item = '';
                    return results;
                }, function(error:any) {
                    $log.debug('Failed to complete the from lookup.');
                })
            };
        }]
    };
}])

.factory('googleService', ['$log', '$q', function($log : any, $q : any) {
    var geocoder:any, service:any;
    try {
        geocoder = new google.maps.Geocoder();
        service = new google.maps.places.AutocompleteService(null, {
                        types: ['geocode']
                    });
    } catch(e) {
        $log.debug("Catching google error that manifests itself when debugging in Firefox only");
    }

    return {
        getAddressDetails: function(address:any, digester:any) {
            var deferred = $q.defer();
            geocoder.geocode({ address: address, region: "au" }, function(results:any, status:any) {
                if (status != google.maps.GeocoderStatus.OK) {
                    digester.$apply(function() {
                        deferred.reject("Failed to find address");
                    });
                } else {
                    digester.$apply(function() {
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

/// <reference path="../../../typings/index.d.ts" />

/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular: ng.IAngularStatic) {

	'use strict';

	angular.module("exp.search.basinsearch", ['exp.search.map.service'])

		.directive("basinSearch", ['$log', '$timeout', 'basinService', function($log: any, $timeout: any, basinService: any) {
			return {
				restrict: "AE",
				transclude: true,
				templateUrl: "searches/basinsearch/basinsearch.html",
				link: function(scope: any, element: any) {
					var timeout: any;

					basinService.load().then(function(data: any): void {
						scope.basinData = data;
					});

					scope.changing = function(): void {
						$log.info("Cancel close");
						$timeout.cancel(timeout);
					};

					scope.cancel = cancel;

					scope.zoomToLocation = function(region: any): void {
						basinService.zoomToLocation(region);
						cancel();
					};

					function cancel(): void {
						$timeout.cancel(timeout);
						timeout = $timeout(function() {
							$log.info("Clear filter");
							scope.nameFilter = "";
						}, 7000);
					}
				}
			};
		}])

		.provider("basinService", BasinsearchServiceProvider)

		.filter("basinFilterList", function() {
			return function(list: any, filter: any, max: number) {
				var response: any[] = [],
					lowerFilter: any, count: number;

				if (!filter) {
					return response;
				}
				if (!max) {
					max = 50;
				}

				lowerFilter = filter.toLowerCase();

				if (list) {
					count = 0;
					list.some(function(item: any) {
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

	function BasinsearchServiceProvider() : any {
		var basinsUrl: string = "service/basinsearch/basins",
			basinShapeUrl: string = "service/basinsearch/basin/",
			baseUrl: string = '',
			basinData: any = {};

		this.setReferenceUrl = function(url: string) {
			basinsUrl = url;
		};

		this.setShapeUrl = function(url: string) {
			basinShapeUrl = url;
		};

		this.setBaseUrl = function(url: string) {
			baseUrl = url;
		};

		this.$get = ['$q', '$rootScope', '$timeout', 'httpData', 'searchMapService',
				function basinServiceFactory($q: any, $rootScope:any, $timeout: any, httpData: any, searchMapService: Searches.ISearchMapService) {
			var service: any = {
				load: function() {
					return httpData.get(baseUrl + basinsUrl, { cache: true }).then(function(response: any) {
						basinData.basins = response.data.basins;
						return basinData;
					});
				},

				zoomToLocation: function(region: any) {
					var bbox: any = region.bbox;
					var polygon: GeoJSON.Polygon = {
						type: "Polygon",
						coordinates: [[
							[bbox.xMin, bbox.yMin],
							[bbox.xMin, bbox.yMax],
							[bbox.xMax, bbox.yMax],
							[bbox.xMax, bbox.yMin],
							[bbox.xMin, bbox.yMin]
						]]
					};

					var broadcastData: Searches.ISearchPerformed = {
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

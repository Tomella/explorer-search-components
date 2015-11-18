/// <reference path="../../../typings/tsd.d.ts" />

/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */


(function(angular: ng.IAngularStatic, L: any) {
'use strict';

angular.module('exp.search.map.service', [])

.factory('searchMapService', ['$timeout', 'mapService', function($timeout: ng.ITimeoutService, mapService: any) {
	var map: any = null,
		statesUrl = "resources/config/states.json",
		lgasUrl = "resources/config/lgas.json",
		lgaShapeUrl = "service/area/lga/",
		lgaData = {},
		lgaTimeout: any,
		lgaLayer: any,
		lgaFadeLayer: any;
	
	mapService.getMap(function(leafletMap: any) {
		map = leafletMap;
	});	
	
	return {
		getDrawer : function(search : Searches.ISearchPerformed) {
			return null; //CesiumDrawing.drawingFactory(viewer, search);
		},
		
		goTo: function(polygon: GeoJSON.Polygon) {
			var xMax  = -1000;
			var xMin  = 1000;
			var yMin  = 1000;
			var yMax  = 1000;
			
			if(polygon.coordinates) {
				polygon.coordinates.forEach(function (value: GeoJSON.Position[]) {
					if(value) {
						value.forEach(function(position: GeoJSON.Position) {
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
			
			mapService.getMap().then(function(map: any) {
				map.fitBounds([
				   [yMin, xMin], 
				   [yMax, xMax]
				]);
			});				
		}
	};
}]);

})(angular, L);
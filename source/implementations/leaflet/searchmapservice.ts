/// <reference path="../../../typings/tsd.d.ts" />

/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
declare var L: any;
/**
 * This package is to handle the artefacts produced by the search events indirectly.
 * There is no reason that it could be used for other like packages.
 */
module Drawing {
  export interface Drawing {
    draw(): void;
    isDrawn(): boolean;
    erase(): void;
    destroy(): void;
  }

    
  export enum DataType {GeoJSONPoint, GeoJSONUrl};
    
  export class GeoJsonUrlHandler implements Drawing {
    private fadeLayer: any;
    private timeout: any;
    private data: any;
    private map: any;
    private options: any;
    
    constructor(map:any, data: any, options: any) {
      this.map = map;
      this.data = data;
      this.options = options;
    }  
    
    draw(): void {
		var opacity = 1;
		var fade = () => {
			opacity -= 0.05;
			if(opacity <= 0) {
				this.map.removeLayer(this.fadeLayer);
			} else {
				this.fadeLayer.setStyle({opacity:opacity});
				this.timeout = this.options.$timeout(fade, 1000);
			}
		};
		
		if(this.fadeLayer) {
			this.options.$timeout.cancel(this.timeout);
			this.map.removeLayer(this.fadeLayer);
		}			
		
		this.options.$http.get(this.data.url).then(function(response: any) {
			this.fadeLayer = L.geoJson(response.data, {
    			style: function (feature: any) {
        			return {
						color: "red",
						opacity: 1
					};
    			}
			}).addTo(this.map);
			this.timeout = this.options.$timeout(fade, 5000);
		}.bind(this));			
    } 
	
    erase(): void {
      if (this.map && this.fadeLayer) {
        this.map.removeLayer(this.fadeLayer);
        this.fadeLayer = null
      }
    } 
    
    destroy(): void {
      this.erase();
      this.map = this.data = null;
    }
    
    isDrawn(): boolean {
      return !this.fadeLayer;
    }
  }
  
  // TODO: No one has asked for it yet. 
  export class GeoJsonPointHandler implements Drawing {
	  private viewer: any;
	  private container: any;
	  private entities: any = null;
	  private options: any = {};
	  
	  constructor(viewer: any, data: any, options: any) {
	    if (options) {
		    this.options = options; 
	    }
	    this.viewer = viewer;
	    this.container = data;
    }
   
  	draw(): void {
		 // Tadah
    }
	
    isDrawn(): boolean {
      return false;
    }
  
  	erase(): void {
	}
	
	destroy(): void {
	  this.erase();
	}	  
  }
}


(function(angular: ng.IAngularStatic, L: any) {
'use strict';

angular.module('exp.search.map.service', [])

.factory('searchMapService', ['$http', '$timeout', 'mapService', function($http: ng.IHttpService, $timeout: ng.ITimeoutService, mapService: any) {
	var map: any = null,
		statesUrl = "resources/config/states.json",
		lgasUrl = "resources/config/lgas.json",
		lgaShapeUrl = "service/area/lga/",
		lgaData = {},
		lgaTimeout: any,
		lgaLayer: any,
		lgaFadeLayer: any;
	
	mapService.getMap().then(function(leafletMap: any) {
		map = leafletMap;
	});	
	
	return {
		getDrawer : function(search: Searches.ISearchPerformed) {
			return drawingFactory(map, search);
		},
		
		goTo: function(polygon: GeoJSON.Polygon) {
			var xMax  = -1000;
			var xMin  = 1000;
			var yMin  = 1000;
			var yMax  = -1000;
			
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
	
	function drawingFactory(map: any, search: Searches.ISearchPerformed): Drawing.Drawing {
		var options = {
			$timeout: $timeout,
			$http: $http
		};
		
		if (search.type == "GeoJSONUrl") {
			return new Drawing.GeoJsonUrlHandler(map, search, options);
		} else if (search.type == "GeoJSONPoint") {
			return new Drawing.GeoJsonPointHandler(map, search, options);
		}
	}
	
}]);

})(angular, L);
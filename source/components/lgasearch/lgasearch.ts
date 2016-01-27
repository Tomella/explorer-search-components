/// <reference path="../../../typings/tsd.d.ts" />
/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular: ng.IAngularStatic) {
'use strict';   

angular.module("exp.search.lgasearch", [])

.directive("lgaSearch", ['$log', '$timeout', 'lgaService', function($log:any, $timeout:any, lgaService:any) {
    return {
        restrict : "AE",
        transclude:true,
        templateUrl : "searches/lgasearch/lgasearch.html", 
        link : function(scope:any, element:any) {
            var timeout:any;
            
            lgaService.load().then(function(data:any) :void {
                scope.lgaData = data;
            });
            
            scope.changing = function():void {
                $log.info("Cancel close");
                $timeout.cancel(timeout);
            };
            
            scope.cancel = cancel;
            
            scope.zoomToLocation = function(region:any) : void {
                lgaService.zoomToLocation(region);
                cancel();
            };
            
            function cancel():void {
                $timeout.cancel(timeout);
                timeout = $timeout(function() {
                    $log.info("Clear filter");
                    scope.nameFilter = "";
                }, 7000);               
            }
        }
    };
}])

.provider("lgaService", LgasearchServiceProvider)

.filter("lgaFilterList", function() {
    return function(list:any, filter:any, max:number) {
        var response:any[] = [],
            lowerFilter:any, count:number;
        
        if(!filter) {
            return response;
        }
        if(!max) {
            max = 50;
        }
        
        lowerFilter = filter.toLowerCase();
        
        if(list) {
            count = 0;
            list.some(function(item:any) {
                if(item.name.toLowerCase().indexOf(lowerFilter) > -1) {
                    response.push(item);
                    count++;
                }
                return count > max;
            });
        }
        return response;
    };
});

function LgasearchServiceProvider() : any {
    var statesUrl:string = "service/lgasearch/states",
        lgasUrl:string = "service/lgasearch/lgas",
        lgaShapeUrl:string = "/explorer-cossap-services/service/lgasearch/lga/",
        lgaData:any = {},
        lgaTimeout:any,
        lgaLayer:any,
        lgaFadeLayer:any, 
        removePrimitiveTimeout : any,
        scene : any;
    
    this.setReferenceUrl = function(url:string) {
        lgasUrl = url;
    };  
    
    this.setShapeUrl = function(url:string) {
        lgaShapeUrl = url;
    };  
    
    this.$get = ['$q', '$rootScope', '$timeout', 'httpData', 'searchMapService', function lgaServiceFactory($q:any, $rootScope:any, $timeout:any, httpData:any, searchMapService:any) {
        var service:any = {
            load : function() {
                httpData.get(lgasUrl, {cache : true}).then(function(response:any) {
                    lgaData.lgas = response.data.lgas;
                }); 
                
                httpData.get(statesUrl, {cache : true}).then(function(response:any) {
                    lgaData.states = response.data.states;
                });
                return $q.when(lgaData);
            },
            
            zoomToLocation : function(region:any) {                
                var bbox:any = region.bbox;
                
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
                   from: "LGA search",
                   type: "GeoJSONUrl",
                   url: lgaShapeUrl + region.id + '/geojson',
			 	   pan: pan,
			       show: true,
                   name: region.name,
                   polygon: polygon
			    };
                
                if(region.id) {
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
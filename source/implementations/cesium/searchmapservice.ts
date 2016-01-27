/// <reference path="../../../typings/tsd.d.ts" />

/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */


declare var Cesium: any;
/**
 * This package is to handle the artefacts produced by the search events indirectly.
 * There is no reason that it could be used for other like packages.
 */
module CesiumDrawing {
  export interface Drawing {
    draw(): void;
    isDrawn(): boolean;
    erase(): void;
    destroy(): void;
  }
    
  export function drawingFactory(viewer: any, data: any): Drawing {
    var type: DataType = DataType[<string>data.type]; 
    
    if( type == DataType.GeoJSONPoint) {
      return new MapLabel(viewer, data, null);
    } else if (type == DataType.GeoJSONUrl) {
      return new GeoJsonDraper(viewer, data, null);
    }
    return null;   
  }
    
  export enum DataType {GeoJSONPoint, GeoJSONUrl};
    
  export class GeoJsonDraper implements Drawing {
    private primitiveCollection: any;
    private data: any;
    private scene: any;
    private options: any;
    
    constructor(viewer:any, data: any, options: any) {
      this.scene = viewer.scene;
      this.data = data;
      this.options = options;
    }  
    
    draw(): void {
      this.primitiveCollection = new Cesium.PrimitiveCollection();
      
      Cesium.GeoJsonDataSource.load(this.data.url).then((dataSource:any) => {
        var primitiveArr: any[] = [];
                    
        for (var i=0; i < dataSource.entities.values.length; i++) {
          var _entity:any = dataSource.entities.values[i];
          var _geometry : any;
          
          if (_entity.polygon !== undefined) {
            _geometry = new Cesium.PolygonGeometry({
              polygonHierarchy : _entity.polygon.hierarchy._value
            });
          }
          
            if (_entity.polyline !== undefined) {
              _geometry = new Cesium.PolygonGeometry({
                polygonHierarchy : {
                  positions : _entity.polyline.positions._value
                }
              });
            }
                    
            if (!_geometry) {
              continue;
            }
                    
            var _geometryInstance:any = new Cesium.GeometryInstance({
              geometry : _geometry,
              id : 'instance',
              attributes : {
                color : new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 1.0, 0.3)
              }
            });
                    
            var primitive = new Cesium.GroundPrimitive({
              geometryInstance : _geometryInstance,
              appearance : new Cesium.PerInstanceColorAppearance({
              translucent : false,
              closed : true
            })
          });
                       
          this.primitiveCollection.add(primitive)                   
        }
        this.scene.primitives.add(this.primitiveCollection);
      }).otherwise(function(error : any){
        //Display any errrors encountered while loading.
        window.alert(error);
      });
    } 
    
    erase(): void {
      if (this.scene && this.primitiveCollection) {
        this.scene.primitives.remove(this.primitiveCollection);
        this.primitiveCollection = null
      }
    } 
    
    destroy(): void {
      this.erase();
      this.scene = this.data = null;
    }
    
    isDrawn(): boolean {
      return !this.primitiveCollection;
    }
  }
  
  export class MapLabel implements Drawing {
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
	    var coordinates = this.container.data.geometry.coordinates;
	    this.erase();
	    this.entities = this.viewer.entities.add({
        position : Cesium.Cartesian3.fromDegrees(coordinates[1], coordinates[0]),
        point : {
          pixelSize : 4,
          color : Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2
        },
        label : {
          text : this.container.data.properties.name,
          font : '16px Helvetica',
          fillColor : Cesium.Color.BLACK,
          outlineColor : Cesium.Color.WHITE,
          outlineWidth : 2,
          horizontalOrigin : Cesium.HorizontalOrigin.LEFT,
          pixelOffset : new Cesium.Cartesian2(10, 0)
        }
	    });
    }
	
    isDrawn(): boolean {
      return this.entities != null;
    }
  
  	erase(): void {
	  	if(this.entities) {
		  	this.viewer.entities.remove(this.entities);
        this.entities = null;
		  }
	  }
	
	  destroy(): void {
		  this.erase();
	  }	  
  }
}


(function(angular: ng.IAngularStatic) {
'use strict';

angular.module('exp.search.map.service', [])

.factory('searchMapService', ['viewerService', function(viewerService: any) {
	var viewer: any = null;
	
  viewerService.getViewer().then(function(cesiumViewer: any) {
		viewer = cesiumViewer;
  }); 
	
	return {
		getDrawer : function(search : Searches.ISearchPerformed) {
      return CesiumDrawing.drawingFactory(viewer, search);
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
/// <reference path="../../../typings/tsd.d.ts" />
/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

interface LastSearchService {
  show(): void;
  hide(): void;
  data: any;
  clear(): void;
  viewer: any;
}

interface LastSearchData {
  search: any;
}

(function(angular: ng.IAngularStatic) {
'use strict';

/*
 * Wiring
 */
angular.module('exp.search.lastsearch', [])

.directive('expLastSearch', ['$document', 'lastSearchService',
          function($document: any, lastSearchService: LastSearchService) {
  return {
    restrict : 'AE',
    transclude : true,
    templateUrl: 'searches/lastsearch/lastsearch.html',
    link : function(scope:any, element:any) {
      scope.data = lastSearchService.data;
      
      $document.on("keyup", keyupHandler);

      scope.toggle = function () {
        if ((scope.data.search.displayed = !scope.data.search.displayed)) {
          lastSearchService.show();
        } else {
          lastSearchService.hide();
        }
      };
      
      scope.pan = function() {
        scope.data.search.pan();
      }
      
      scope.close = function() {        
          lastSearchService.clear();
      }
      
      function keyupHandler(keyEvent: any) {
    			if(keyEvent.which == 27) {
    				keyEvent.stopPropagation();
    				keyEvent.preventDefault();
    				scope.$apply(function() {
        				scope.close();
    				});
    			}
    		}
    }
  };
}]) 

.factory('lastSearchService', ['$log', '$rootScope', 'searchMapService', function ($log: ng.ILogService, $rootScope: ng.IRootScopeService, searchMapService: any) {
    var data:LastSearchData = {
      search: null
    };
    var drawing: any;
    
    var service = {
      show: function() {
        drawing.draw();
      },
    
      hide: function() {
        if(drawing) {
          drawing.erase();
        }       
      },
      data: function() {
        return data;
      },
      
      isShowing: function() {
        drawing.isDrawn();
      },
      
      clear: function (){
        this.hide();
        data.search = null;
      }
   };
   
   $rootScope.$on('search.performed', function(event : any, search : Searches.ISearchPerformed) {
      if (drawing) {
         drawing.destroy();
      }
      drawing = searchMapService.getDrawer(search);
      data.search = search;
          
      if (search.show) {
        drawing.draw();
      }
   });
   
   return service;
}]);

})(angular);

/// <reference path="../../../typings/index.d.ts" />
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

.directive('expLastSearch', ['$document', 'lastSearchService', '$rootScope',
          function($document: any, lastSearchService: LastSearchService, $rootScope: any) {
  return {
    restrict : 'AE',
    transclude : true,
    templateUrl: 'searches/lastsearch/lastsearch.html',
    link : function(scope:any, element:any) {
      scope.data = lastSearchService.data();
      
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
          $rootScope.$broadcast('search.cleared');
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

.provider('lastSearchService', [function () {
    var listen = true;
    
    this.noListen = function() {
      listen = false;
    }
    
    this.$get = ['$log', '$rootScope', 'searchMapService', function ($log: ng.ILogService, $rootScope: ng.IRootScopeService, searchMapService: any) {
    
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
    
    $rootScope.$on('search.performed', listener);
    
    function listener(event: any, search: any) {
      if (drawing) {
        drawing.destroy();
      }
      drawing = searchMapService.getDrawer(search);
      if(listen) {
        data.search = search;
      }
          
      if (search.show) {
        search.displayed = true;
        drawing.draw();
      }
    };
   
    return service;
  }];
}]);

})(angular);

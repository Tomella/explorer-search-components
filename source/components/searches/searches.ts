/// <reference path="../../../typings/tsd.d.ts" />

/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */


module explorer.search {
'use strict';

angular.module("exp.search.searches", ['exp.search.lastsearch'])

.directive('searchSearches', ['searchService', function(searchService: any) {
    return {
        restrict: "AE",
        replace: true,
        transclude: true,
        templateUrl: 'searches/searches/searches.html',
        scope: {
            name : "@"
        },
        controller: ['$scope', function($scope:any) {
            $scope.state = {
                showSearchButton : true,
                searches : []
            }
                    
            $scope.switch = function (data:any) {
                activate(data);
            };
            
            this.add = function (data:any) {
                console.log("Adding");
                $scope.state.searches.push(data);
            };
            
            this.active = function (data:any) {
                activate(data);
            };        
            
            function activate(data:any) {
                $scope.state.searches.forEach(function (item:any) {
                    item.active = false;
                });
                data.active = true;
                if($scope.name) {
                    searchService.getSearches()[$scope.name] = data;
                }                        
            }
        }]
    };
}]) 

.directive('searchSearch', function() {
    return {
        //replace : true,
        template:"<div ng-transclude ng-show='active'></div>",
        transclude:true,
        require: "^searchSearches",
        scope: {
            label: "@",
            key: "@",
            active: "=default"
        },
        link : function(scope:any, element: any, attrs: any, ctrl: any) {
            ctrl.add(scope); 
        }
    };
})
    
.factory('searchService', [function() {
    var searches: any = {};
    var service: any = {};
    
    service.getSearches = function() {
      return searches;  
    };
    
    return service;
}]);
   
}
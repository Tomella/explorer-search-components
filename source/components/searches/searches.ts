/// <reference path="../../../typings/tsd.d.ts" />

/*
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */


(function(angular: ng.IAngularStatic) {
'use strict';

angular.module("exp.search.searches", [])

.directive('searchesSearches', function() {
    return {
        restrict : "AE",
        replace : true,
        transclude:true,
        templateUrl : 'searches/searches/searches.html',
        scope : {
            name : "@"
        },
        controller : ['$scope', function($scope:any) {
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
            }
        }]
    };
}) 

.directive('searchesSearch', function() {
    return {
        replace : true,
        template:"<div ng-transclude ng-show='active'></div>",
        transclude:true,
        require : "^searchesSearches",
        scope : {
            label : "@",
            active : "=default"
        },
        link : function(scope:any, element : any, attrs : any, ctrl : any) {
            ctrl.add(scope); 
        }
    };
});
    
})(angular);
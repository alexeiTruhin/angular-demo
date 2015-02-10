'use strict';

/* Controllers */

var psgControllers = angular.module('psgControllers', []);

psgControllers.controller('psgCtrl', ['$scope', 'Data', '$location', '$route', '$routeParams',
  function($scope, Data, $location, $route, $routeParams) {
    /* $scope.param Structure :
        {
          <facet1> : [<option1>, <option2>, ... <optionX>],
          <facet2> : [<option1>, <option2>, ... <optionX>],
          ...
          <facetY> : [<option1>, <option2>, ... <optionX>]
        }
    */
    $scope.param = {};

    /* $scope.url Structure :
        '<facet1>=<option1>,<option2>, ... <optionX>&<facet2>= ...'
    */
    $scope.url = '';

    $scope.data = Data.query(); // Data.query().<products,facets,facetOrder>















    $scope.toggleParam = function (facet, option) {
      // if param[facet] doesn't exist, init with an empty array
      if (typeof $scope.param[facet] === 'undefined') {
        $scope.param[facet] = [];
      }

      // add or remove option from param[facet]
      var index = $scope.param[facet].indexOf(option);
      if (index  > -1) {
        $scope.param[facet].splice(index, 1);
      } else {
        $scope.param[facet].push(option);
      }

      $scope.updateUrl()

      $scope.data= Data.get({url: $scope.url});
      $location.url('?' + $scope.url);


      // consoling for testing
      //console.log($location.search());
/*      console.log($location.url());
      console.log($scope.url);
      console.log($location.path() );

      for ( i in $scope.data.facetOrder) {
        if (typeof $scope.param[$scope.data.facetOrder[i]] !== 'undefined') {
          console.log($scope.data.facetOrder[i], $scope.param[$scope.data.facetOrder[i]]);
        }
      }*/
    };

    $scope.updateUrl = function () {
      $scope.url = '';

      var p;
      for (p in $scope.param) {
        if ($scope.param[p].length) {
          $scope.url += p + '=' + $scope.param[p].join(',') + '&';
        }
      }

      if ($scope.url.length) {
        $scope.url = $scope.url.substring(0, $scope.url.length - 1);
      }
    };

  }]);
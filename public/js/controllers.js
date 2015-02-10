'use strict';

/* Controllers */

var psgControllers = angular.module('psgControllers', []);

psgControllers.controller('psgCtrl', ['$scope', 'Data', '$location', '$route', '$routeParams',
  function($scope, Data, $location, $route, $routeParams) {
    // --------- Initialization BEGIN -------------- //

    /* $scope.param Structure :
        {
          <facet1> : [<option1>, <option2>, ... <optionX>],
          <facet2> : [<option1>, <option2>, ... <optionX>],
          ...
          <facetY> : [<option1>, <option2>, ... <optionX>]
        }
    */
    $scope.param = {};

    // initialize param with params from url
    $scope.param = initParam();

    /* $scope.url Structure :
        '<facet1>=<option1>,<option2>, ... <optionX>&<facet2>= ...'
    */
    $scope.url = '';

    // initialize url variable with $location.url
    $scope.url = initUrl();

    // GET data from server. $scope.data.<products,facets,facetOrder>
    $scope.data = Data.get({url: $scope.url});

    // --------- Initialization END -------------- //



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

      // update url
      updateUrl();

      // update data based on new url
      $scope.data= Data.get({url: $scope.url});
    };


    function updateUrl() {
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

      $location.url('?' + $scope.url);
    };

    function initParam() {
      var locParam = $location.search();
      var p;

      for (p in locParam) {
        locParam[p] = locParam[p].split(',');
      };

      return locParam;
    };

    function initUrl() {
       return '' + $location.url().substring(1, $location.url().length);
    }

  }]);
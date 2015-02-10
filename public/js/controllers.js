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

    /* $scope.url Structure :
        '<facet1>=<option1>,<option2>, ... <optionX>&<facet2>= ...'
    */
    $scope.url = '';

    // $scope.data.<products,facets,facetOrder>
    $scope.data = {};


    // on init and change url
    $scope.$on('$locationChangeSuccess', function(next, current) {
      // initialize param with params from url
      $scope.param = initParam();
      // initialize url variable with $location.url
      $scope.url = initUrl();
      // GET data from server.
      getData($scope.url);
    });


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
      getData($scope.url);
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

    function getData(url) {
      // $scope.data.<products,facets,facetOrder>
      Data.get({url: url}, function(data) {
        $scope.data.products = data.products;
        $scope.data.facets = data.facets;
        $scope.data.facetOrder = data.facetOrder;
        addCheckboxes($scope.data.facets, $scope.param);
        //console.log($scope.data.facets)
      });
    }

    function addCheckboxes(facets, param) {
      var f;
      var facet;
      var o;
      var p;
      var pm;
      for (f in facets) {
        facet = facets[f];
        if (typeof facet.options !== 'undefined')
          for (o in facet.options) {
            facet.options[o] = [facet.options[o]];
            if (typeof param[f] !== 'undefined' && param[f].indexOf(facet.options[o][0]) > -1) {
              facet.options[o].push(true);
            } else {
              facet.options[o].push(false);
            }
          }
      }
    }

    function initParam() {
      var locParam = $location.search();
      var p;

      for (p in locParam) {
        locParam[p] = locParam[p].split(',');
      };

      // add checkbox: true to $scope.data.facetOrder
      return locParam;
    };

    function initUrl() {
       return '' + $location.url().substring(1, $location.url().length);
    }
  }]);
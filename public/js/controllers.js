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


    // on init and change of location (url)
    $scope.$on('$locationChangeSuccess', function(next, current) {
      // initialize param with params from url
      $scope.param = initParam();
      // initialize url variable with $location.url
      $scope.url = initUrl();
      // GET data from server.
      getData($scope.url);
    });

    // on start changing location (load)
    $scope.$on('$locationChangeStart', function(next, current) {
      //console.log('start');
    });


    // --------- Initialization END -------------- //


    // change parameters from facet.
    // *used on facet's options click.
    $scope.toggleParam = function (facet, option, filterView) {
      // if param[facet] doesn't exist, init with an empty array
      if (typeof $scope.param[facet] === 'undefined') {
        $scope.param[facet] = [];
      }

      var index;
      if (filterView == 'rangeSlider') {
        // option is an array in this case
        $scope.param[facet] = option;
      } else { // checkbox
        // add or remove option from param[facet]
        index = $scope.param[facet].indexOf(option);
        if (index  > -1) {
          $scope.param[facet].splice(index, 1);
        } else {
          $scope.param[facet].push(option);
        }
      }

      // update url
      $scope.url = $scope.updateUrl();

      // update data based on new url
      //getData($scope.url);
    };

    // update url parameter and location
    $scope.updateUrl = function updateUrl() {
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

      return $scope.url;
    };

    function getData(url) {
      // $scope.data.<products,facets,facetOrder>
      Data.get({url: url}, function(data) {
        // for avoiding future missundenrstanding between Numbers and Strings
        // *not applying to data, because it has some additional properties.
        transformValuesToString(data.products);
        transformValuesToString(data.facets);
        transformValuesToString(data.facetOrder);

        $scope.data.products = data.products;
        $scope.data.facets = data.facets;
        $scope.data.facetOrder = data.facetOrder;

        // <facet1> : [{<option1Name>: <option1Count}, ... ]
        // =>
        // <facet1> : [[<option1Name>, <option1Count}], ... ]
        transformOptionsObjToArray($scope.data.facets);
        //console.log($scope.data.facets);

        addCheckboxes($scope.data.facets, $scope.param);
      });
    }

    function transformOptionsObjToArray(facets) {
      var f; // '<facetX>'
      var facet; // facets[<facetX>]
      var o; // facets[<facetX>].options.indexOf(<str_iptionX>)
      var item;
      for (f in facets) {
        facet = facets[f];
        if (typeof facet.options !== 'undefined')
          for (o in facet.options) {
            for (item in facet.options[o]) {
              facet.options[o]= [item, facet.options[o][item]];
            }
          }
      }
    }

    // add checkbox state of options' checkboxes
    function addCheckboxes(facets, param) {
      /*
        facets: {
          <facet1>: {
            name: <str_name>,
            options: [
              <str_option1>,
              <str_option2>,
              ...
            ]
          }
          <facet2>: {...}
          ...
        }
        param: {
          <facet1> : [<option1>, <option2>, ... <optionX>],
          <facet2> : [<option1>, <option2>, ... <optionX>],
          ...
          <facetY> : [<option1>, <option2>, ... <optionX>]
        }
      */

      var f; // '<facetX>'
      var facet; // facets[<facetX>]
      var o; // facets[<facetX>].options.indexOf(<str_iptionX>)
      for (f in facets) {
        facet = facets[f];
        if (typeof facet.options !== 'undefined')
          for (o in facet.options) {
            if (typeof param[f] !== 'undefined' && param[f].indexOf(facet.options[o][0]) > -1) {
              facet.options[o].push(true);
            } else {
              facet.options[o].push(false);
            }
          }
      }
    }

    function transformValuesToString(obj) {
      var o;
      if (typeof obj === 'object') {
        for (o in obj) {
          if (typeof obj[o] === 'object') {
            transformValuesToString(obj[o]);
          } else {
            obj[o] += '';
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

    //-------- HELPER functions -------//

    // returns min value of array
    $scope.getMin = function (arr) {
      if (arr.length == 0) return (-1);
      if (arr.length == 1) return (arr[0]);

      var min = arr[0];
      var id = 0;
      var i, id;
      for (i = 1; i < arr.length; i++) {
        if (min <= arr[i]) continue;

        min = arr[i];
        id = i;
      }

      return min;
    }

    // returns id of the element with min value
    $scope.getMinId = function (arr) {
      if (arr.length == 0) return (-1);
      if (arr.length == 1) return (0);

      var min = arr[0];
      var id = 0;
      var i, id;
      for (i = 1; i < arr.length; i++) {
        if (min <= arr[i]) continue;

        min = arr[i];
        id = i;
      }

      return id;
    }

    // return id of the element with max value
    $scope.getMax = function (arr) {
      if (arr.length == 0) return (-1);
      if (arr.length == 1) return (arr[0]);

      var max = arr[0];
      var id = 0;
      var i, id;
      for (i = 1; i < arr.length; i++) {
        if (max >= arr[i]) continue;

        max = arr[i];
        id = i;
      }

      return max;
    }

    // return id of the element with max value
    $scope.getMaxId = function (arr) {
      if (arr.length == 0) return (-1);
      if (arr.length == 1) return (0);

      var max = arr[0];
      var id = 0;
      var i, id;
      for (i = 1; i < arr.length; i++) {
        if (max >= arr[i]) continue;

        max = arr[i];
        id = i;
      }

      return id;
    }

    // return array of objects' properties, from an array of objects
    // ex: [{'34': 0}, {'65': '3'}] => [34, 65]
    $scope.getObjectsPropNumbers = function (arr) {
      var prop = [];

      arr.forEach(function (item) {
        prop.push(parseFloat(option[0]));
      });

      return prop;
    }

    // getMin for range slider
    $scope.getMinRange = function (options) {
      var arr = getObjectsPropNumbers(options);

      return $scope.getMin(arr);

    }

    // getNextValue for rangeSlider
    $scope.getNextValue = function ( arr, value, dir){
      if (arr.indexOf(value) > -1) return value;

      arr.sort();

      var prev = arr[0];
      var next = arr[arr.length - 1];

      var i;
      for (i = 0; i < arr.length; i++) {
        if (value > arr[i]) prev = arr[i]
      }
      for (i = arr.length; i > 0; --i) {
        if (value < arr[i]) next = arr[i]
      }


      if ( (next - value) < (value - prev) ) {
        return next;
      } else {
        return prev;
      }

    }



  }]);
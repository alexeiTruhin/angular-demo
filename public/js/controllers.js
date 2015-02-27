'use strict';

/* Controllers */

var psgControllers = angular.module('psgControllers', []);

psgControllers.controller('psgCtrl', ['$scope', '$timeout', 'Data', '$location', '$route', '$routeParams',
  function($scope, $timeout, Data, $location, $route, $routeParams) {
    // ---------------- CONSTANTS ------------------ //
    var
    _rangeSlider = 'rangeSlider',
    _facetShow = '_facetShow',
    _selected = '_selected',
    _id = 'id',
    _name = 'name',
    _order = '_order',
    _$psgTable = '.psg-table',
    _$psgFacetsList = '.psg-facets-list',
    _$psgFacetsBlock = '.psg-facets-block';

    $scope._facetShow = _facetShow;
    $scope._selected = _selected;
    $scope._order = _order;
    $scope._rangeSlider = _rangeSlider;
    $scope._id = _id;
    $scope._name = _name;
    $scope._$psgTable = _$psgTable;
    $scope._$psgFacetsList = _$psgFacetsList;
    // -------------------------------------------- //




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

    // $scope.data.<products,facets,facetShow>
    $scope.data = {};

    $scope.facetShowChange = false;

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
      if (filterView === _rangeSlider) {
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
      // $scope.data.<products,facets,facetShow>
      Data.get({url: url}, function(data) {
/*        // Add 'id' as facet
        data.facets[_id] = {"name": "Part Number"};
        data.facetShow = [_id].concat(data.facetShow);
        data.facetAll = [_id].concat(data.facetAll);*/


        // for avoiding future missundenrstanding between Numbers and Strings
        // *not applying to data, because it has some additional properties.
        transformValuesToString(data.products);
        transformValuesToString(data.facets);
        transformValuesToString(data.facetShow);
        transformValuesToString(data.facetAll);
        transformValuesToString(data.id);
        transformValuesToString(data.tatalCount);

        $scope.data.products = data.products;
        $scope.data.facets = data.facets;
        $scope.data.facetAll = data.facetAll;
        $scope.data.id = data.id;
        $scope.data.totalCount = data.totalCount;

        if (typeof $scope.param[_facetShow] !== 'undefined') {
          $scope.data.facetShow = $scope.param[_facetShow].slice();
          $scope.tempFacetShow = $scope.param[_facetShow].slice(); // copy the array not ref.
          $scope.tempFacetHide = $(data.facetAll).not($scope.param[_facetShow]).get();
        } else {
          $scope.data.facetShow = data.facetShow;
          $scope.tempFacetShow = data.facetShow.slice(); // copy the array not ref.
          $scope.tempFacetHide = $(data.facetAll).not(data.facetShow).get();
        }

        // <facet1> : [{<option1Name>: <option1Count}, ... ]
        // =>
        // <facet1> : [[<option1Name>, <option1Count}], ... ]
        transformOptionsObjToArray($scope.data.facets);
        //console.log($scope.data.facets);

        addCheckboxes($scope.data.facets, $scope.param);
        addSelected($scope.data.products, $scope.param);

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

    function addSelected(products, params) {
      var prod;
      if (typeof params[_selected] !== 'undefined') {
        for (prod in products)
          products[prod][_selected] = true;
      } else {
        for (prod in products)
          products[prod][_selected] = false;
      }
    }

    $scope.compareSelected = function compareSelected() {
      var prod;
      var selected = [];
      var products = $scope.data.products;
      if (typeof $scope.param[_selected] === 'undefined') {
        selected = $scope.getSelected();

        if (selected.length > 1) {
          $scope.param[_selected] = selected;
          $scope.url = $scope.updateUrl();
        }
      } else {
        delete $scope.param[_selected];
        $scope.url = $scope.updateUrl();
      }
    }

    $scope.getSelected = function getSelected() {
      var prod;
      var selected = [];
      var products = $scope.data.products;
      if (typeof $scope.param[_selected] === 'undefined') {
        for (prod in products)
          if (typeof products[prod][_selected] !== 'undefined' && products[prod][_selected])
            selected.push(products[prod][_id]);
      }

      return selected;
    }

    $scope.selectProduct = function selectProduct(prodId) {
      var products = $scope.data.products;
      var prod;
      if (typeof $scope.param[_selected] === 'undefined') {
        for (prod in products) {
          if (products[prod][_id] === prodId) {
            products[prod][_selected] = !products[prod][_selected];
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
/*        if (p === _facetShow) {
          // add 'id' to facets
          locParam[p] = [_id].concat(locParam[p]);
        }*/
      };

      // add checkbox: true to $scope.data.facetShow
      return locParam;
    };

    function initUrl() {
      return '' + $location.url().substring(1, $location.url().length);
    }

    // add/change order depending on facet.
    // *used on order setter click.
    // *options: ascending, descending
    $scope.setOrder = function (facet, order) {
      // if param[facet] doesn't exist, init with an empty array
      if (typeof $scope.param[facet] === 'undefined') {
        $scope.param[_order] = [];
      }

      $scope.param[_order] = [facet, order];

      // update url
      $scope.url = $scope.updateUrl();

      // update data based on new url
      //getData($scope.url);
    };

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
        if (value >= arr[i]) prev = arr[i]
      }
      for (i = arr.length; i > 0; --i) {
        if (value <= arr[i]) next = arr[i]
      }


      if ( (next - value) < (value - prev) ) {
        return next;
      } else {
        return prev;
      }

    }

    $scope.changefacetShow = function(newfacetShow) {
/*      // Delete 'id' facet
      newfacetShow.splice(0, 1);*/

      //$scope.data.facetShow = newfacetShow;
      $timeout(function(){
        // update url
        $( _$psgTable ).sorttable( "refresh" );
        $scope.param[_facetShow] = newfacetShow.slice();
        $scope.tempFacetShow = newfacetShow.slice();

        //$scope.data.facetShow = newfacetShow;
        $scope.url = $scope.updateUrl();
      }, 0)

    };


    $scope.psgFacetsSort = {
      connectWith: _$psgFacetsList,
      stop: function(e, ui) {
        //console.log(ui.item);
      }
    }

    $scope.resetFacets = function() {
      delete $scope.param[_facetShow];
      $scope.url = $scope.updateUrl();
      $scope.toggleFacetsBlock();
    }

    $scope.applyFacets = function() {
      $scope.param[_facetShow] = $scope.tempFacetShow.slice();
      $scope.url = $scope.updateUrl();
      $scope.toggleFacetsBlock();
    }

    $scope.selectAllFacets = function() {
      $scope.tempFacetShow = $scope.data.facetAll.slice();
      $scope.tempFacetHide = [];
    }

    $scope.removeFacet = function (facet) {
      var index = $scope.data.facetShow.indexOf(facet);
      if (index > -1) {
        $scope.data.facetShow.splice(index, 1);
        $scope.tempFacetShow = $scope.data.facetShow.slice();
        $scope.tempFacetHide.push(facet);
      }

    }

    $scope.toggleFacetsBlock = function () {
      var $facet_block = $(_$psgFacetsBlock);
      var $th = $(_$psgTable).children().find('>tr >th').first();
      $facet_block.toggle();
      $facet_block.css({
        'left': $th.outerWidth()
      })
    }

    $scope.resetFilters = function () {
      $scope.param = {};
      $scope.updateUrl();
    }

    $scope.toggleAllProductDetails = function (e) {
      $('.psg-product-details').hide();
      if (typeof e !== 'undefined') {
        var $block = $(e.currentTarget).parent().find('.psg-product-details');
        $block.toggle();

        var $tr_all = $(e.currentTarget).parent().parent().parent().children();
        var $tr_this = $(e.currentTarget).parent().parent();
        var index_this = $tr_all.index($tr_this);

        if (index_this > $tr_all.length/2) {
          $block.css('bottom', 0);
          $block.css('top', 'auto');
        }
      }
    }

    /* jQuery part */
    $(document).ready(function() {



    })

  }]);


'use strict';

/* Services */

var psgDirectives = angular.module('psgDirectives', []);

psgDirectives.directive('applyFilters',['$compile', '$timeout', function($compile, $timeout) {
  var rangeSliderCount = 0;

  // ---- Templates -----//
  var template_facetName = '{{data.facets[facet].name}}';
  var template_order =
      '<div class="order">' +
        '<a href ng-click="setOrder(facet, \'asc\')">(&#9650;)</a> | <a href ng-click="setOrder(facet, \'desc\')">(&#9660;)</a>' +
      '</div>';
  var template_compareSelectedButton =
      '<span ng-if="facet === \'id\'">' +
        '<button ng-click="compareSelected()">' +
          'Compare Selected' +
        '</button>' +
      '</span>';
  var template_draghandle = '<div class="draghandle" ng-if="facet !== \'id\'"> drag </div>';


  function getRangeSliderTemplate () {
    var range = 'range' + ++rangeSliderCount;
    var template =  template_draghandle +
      template_facetName +
      '<div range-slider orientation="vertical" min="' + range +'.minL" max="' + range + '.maxL" model-min="' + range + '.minS" model-max="' + range + '.maxS" step="0.1" decimal-places="1"></div>' +
      '<strong>Min</strong> <input type="text" class="input-small" ng-model="' + range + '.minS">' +
      '<strong>Max</strong> <input type="text" class="input-small" ng-model="' + range + '.maxS">' +
      template_compareSelectedButton +
      template_order;
    return template;
  }

  function getCheckboxTemplate () {
    var template = template_draghandle +
      template_facetName +
      '<p ng-repeat="option in data.facets[facet].options">' +
        '<label>' +
          '<input type="checkbox" ng-click="toggleParam(facet, option[0], data.facets[facet].filterView)" ng-checked="option[2]"/>' +
          '{{option[0]}} ({{option[1]}})' +
        '</label>' +
      '</p>' +
      template_compareSelectedButton +
      template_order;
    return template;
  }

  return {
    restrict: 'ACE',

    link: function (scope, element, attr) {
          var facet = scope.data.facets[scope.facet];
          var template;

          // Select template
          if (facet.filterView == 'rangeSlider') {
            template = getRangeSliderTemplate();
          } else {
            template = getCheckboxTemplate();
          }

          element.html(template);

          $compile(element.contents())(scope);
          if (scope.facet === 'id') {
            $(element).addClass('nodrag');
          }
          // -----------

          if (facet.filterView == 'rangeSlider') {
            var range = 'range' + rangeSliderCount;

            var facetOptions = facet.options;
            var fOptionsValues = [];
            var min, max;
            var minS, maxS, rangeS = []; // S from 'current State'

            facetOptions.forEach(function (option) {
              fOptionsValues.push(parseFloat(option[0]));
              if (option[2]) {
                rangeS.push(parseFloat(option[0]));
              }
            });
            fOptionsValues.sort();
            rangeS.sort();

            min = fOptionsValues[0];
            max = fOptionsValues[fOptionsValues.length - 1];
            if (rangeS.length >= 1) {
              minS = rangeS[0];
              maxS = rangeS[rangeS.length - 1];
            } else {
              minS = min;
              maxS = max;
            }


            scope[range] = {
              minL: min, // min Limit
              maxL: max, // max Limit
              minS: minS + 0.1, // min State
              maxS: maxS - 0.1 // max State
            };

            // ----- Watch RangeSlider's varibles ----- //
            var firstMin = true;
            scope.$watch(range + '.minS', function(newValue, oldValue) {
              // hack - should rewrite
              // rangeSlider doesn't want to init
              if (firstMin) {
                scope[range].minS = minS;
                firstMin = false;
              }

              if (newValue !== oldValue)
                scope[range].minS = scope.getNextValue(fOptionsValues, newValue);
            });

            var firstMax = true;
            scope.$watch(range + '.maxS', function(newValue, oldValue) {
              // hack - should rewrite
              // rangeSlider doesn't want to init
              if (firstMax) {
                scope[range].maxS = maxS;
                firstMax = false;
              }

              if (newValue !== oldValue)
                scope[range].maxS = scope.getNextValue(fOptionsValues, newValue);

              //console.log(scope.data.facets[scope.facet].options)
            });
            // -------------------- //

            scope.$watch('data.facets[facet].options', function(newValue, oldValue) {
              var facet = scope.data.facets[scope.facet];
              var facetOptions = facet.options;
              var fOptionsValues = [];
              var min, max;
              var minS, maxS, rangeS = []; // S from 'current State'

              facetOptions.forEach(function (option) {
                fOptionsValues.push(parseFloat(option[0]));
                if (option[2]) {
                  rangeS.push(parseFloat(option[0]));
                }
              });
              fOptionsValues.sort();
              rangeS.sort();

              min = fOptionsValues[0];
              max = fOptionsValues[fOptionsValues.length - 1];
              if (rangeS.length >= 1) {
                minS = rangeS[0];
                maxS = rangeS[rangeS.length - 1];
              } else {
                minS = min;
                maxS = max;
              }

              scope[range].minS = minS;
              scope[range].maxS = maxS;
            });


            // ----- Send params to $scope.params ------ //
              var mousedown = false;
              var tempRange;
              $(element).find('.ngrs-handle').on('mousedown', function(){
                tempRange = [scope[range].minS, scope[range].maxS];
                mousedown = true;
              });

              $(window).on('mouseup', function(){
                if (mousedown) {
                  if (tempRange[0] !== scope[range].minS || tempRange[1] !== scope[range].maxS) {
                    $timeout(function() {
                      scope.toggleParam(
                        scope.facet,
                        [scope[range].minS + '', scope[range].maxS + ''],
                        facet.filterView
                      );
                    }, 0);
                  }
                  mousedown = false;
                }

              });

            // -------------------- //
          }

    }
  }
}]);

psgDirectives.directive('dragbleTable',['$compile', '$timeout', function($compile, $timeout) {

  return {
    restrict: 'C',
    link: function (scope, element, attr) {


      $('.psgTable').sorttable({
          items: '>:not(.nodrag)',
          handle: '.draghandle', // drag using handle
          axis: 'x',
          revert: true,
          scroll: false,
          forceHelperSize: true,
          distance: 0,
          tolerance: 'pointer',
          start: function (e, ui) {
            ui.item.parents('.psgTable').children().find('>tr:not(.ui-sortable)').fadeTo('slow', 0.5);
          },
          stop: function (e, ui) {
            ui.item.parents('.psgTable').children().find('>tr:not(.ui-sortable)').fadeTo('normal', 1);

            // Get new order
            var facetOrder = [];
            ui.item.parents('.psgTable').children().find('>tr.ui-sortable >th').each(function(index, item) {
              facetOrder.push($(item).attr('id'));
            });
            scope.changeFacetOrder(facetOrder);
          }
      });


    }
  }
}]);



'use strict';

/* Services */

var psgDirectives = angular.module('psgDirectives', []);

psgDirectives.directive('applyFilters',['$compile', '$timeout', function($compile, $timeout) {
    // ---------------- CONSTANTS ------------------ //
    var
    _facetShow = '_facetShow',
    _selected = '_selected',
    _order = '_order',
    _rangeSlider = 'rangeSlider',
    _id = 'id',
    _name = 'name',
    _$psgTable = '.psg-table',
    _$psgFacetsList = '.psg-facets-list';

    // -------------------------------------------- //

  var rangeSliderCount = 0;

  // ---- Templates -----//
  var template_facetName = '<p class="psg-facet-title">{{data.facets[facet].name}}</p>';
  var template_draghandle = '<span class="draghandle"></span>';
  var template_removeFacet = '<a href ng-click="removeFacet(facet)" class="removeFacet"></a>';


  function getRangeSliderTemplate () {
    var range = 'range' + ++rangeSliderCount;
    var template =
      '<div class="psg-facet-top">' +
      template_draghandle +
      template_removeFacet +
      '</div>' +
      '<div class="psg-facet-body">' +
        template_facetName +
        '<div class="psg-range-slider-block">' +
        '<div class="psg-range-slider" range-slider orientation="vertical" min="' + range +'.minL" max="' + range + '.maxL" model-min="' + range + '.minS" model-max="' + range + '.maxS" step="0.1" decimal-places="1"></div>' +
        '<input type="text" class="psg-range-slider-input psg-range-slider-input-min" ng-model="' + range + 'input.minS" ng-blur="onblur($event, \'' + range + '\', \'min\')"/>' +
        '<input type="text" class="psg-range-slider-input psg-range-slider-input-max" ng-model="' + range + 'input.maxS" ng-blur="onblur($event, \'' + range + '\', \'max\')"/>' +
        '</div><div class="clearfix"></div>' +
      '</div>';
    return template;
  }

  function getCheckboxTemplate () {
    var template =
      '<div class="psg-facet-top">' +
      template_draghandle +
      template_removeFacet +
      '</div><div class="psg-facet-body">' +
      template_facetName +
      '<p ng-repeat="option in data.facets[facet].options">' +
        '<label>' +
          '<input type="checkbox" ng-click="toggleParam(facet, option[0], data.facets[facet].filterView)" ng-checked="option[2]"/>' +
          '{{option[0]}} <span class="psg-result-number">({{option[1]}})</span>' +
        '</label>' +
      '</p>' +
      '</div>';
    return template;
  }

  return {
    restrict: 'C',

    link: function (scope, element, attr) {
          var facet = scope.data.facets[scope.facet];
          var template;

          // Select template
          if (facet.filterView === _rangeSlider) {
            template = getRangeSliderTemplate();
          } else {
            template = getCheckboxTemplate();
          }

          element.html(template);

          $compile(element.contents())(scope);
          if (scope.facet === _id) {
            $(element).addClass('nodrag');
          }

          $(element).find('.psg-range-slider-input').on('focus', function(e){
            e.stopPropagation();
          });
          // -----------

          if (facet.filterView === _rangeSlider) {
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
            scope[range + 'input'] = {
              minS: minS,
              maxS: maxS
            }

            // ----- Watch RangeSlider's varibles ----- //
            var firstMin = true;
            scope.$watch(range + '.minS', function(newValue, oldValue) {
              // hack - should rewrite
              // rangeSlider doesn't want to init
              if (firstMin) {
                scope[range].minS = minS;
                firstMin = false;
              }

              if (newValue !== oldValue) {
                scope[range].minS = scope.getNextValue(fOptionsValues, newValue);
                scope[range + 'input'].minS = scope[range].minS;
              }
            });

            var firstMax = true;
            scope.$watch(range + '.maxS', function(newValue, oldValue) {
              // hack - should rewrite
              // rangeSlider doesn't want to init
              if (firstMax) {
                scope[range].maxS = maxS;
                firstMax = false;
              }

              if (newValue !== oldValue){
                scope[range].maxS = scope.getNextValue(fOptionsValues, newValue);
                scope[range + 'input'].maxS = scope[range].maxS;
              }

              //console.log(scope.data.facets[scope.facet].options)
            });
            // -------------------- //
/*
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
            });*/


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
                      [
                        scope[range].minS + '',
                        scope[range].maxS + ''
                      ],
                      facet.filterView
                    );

                  }, 0);
                }
                mousedown = false;
              }
            });

            // -------------------- //

            scope.onblur = function ($event, range, handle) {
              if (handle === 'min') {
                scope[range].minS = scope[range + 'input'].minS;
              } else if (handle === 'max') {
                scope[range].maxS = scope[range + 'input'].maxS;
              }
              $timeout(function(){
                scope.toggleParam(
                  scope.facet,
                  [
                    scope[range].minS + '',
                    scope[range].maxS + ''
                  ],
                  facet.filterView
                );
              }, 0)

            }
          }

    }
  }
}]);

psgDirectives.directive('dragbleTable',['$compile', '$timeout', function($compile, $timeout) {
  // ---------------- CONSTANTS ------------------ //
  var
  _facetShow = '_facetShow',
  _selected = '_selected',
  _order = '_order',
  _rangeSlider = 'rangeSlider',
  _id = 'id',
  _name = 'name',
  _$psgTable = '.psg-table',
  _$psgFacetsList = '.psg-facets-list';

  // -------------------------------------------- //

  return {
    restrict: 'C',
    link: function (scope, element, attr) {

      $(_$psgTable).sorttable({
          items: '>:not(.nodrag)',
          handle: '.draghandle', // drag using handle
          axis: 'x',
          revert: true,
          scroll: false,
          forceHelperSize: true,
          distance: 0,
          tolerance: 'pointer',
          start: function (e, ui) {
            //ui.item.parents('.psgTable').children().find('>tr:not(.ui-sortable)').fadeTo('slow', 0.5);
          },
          stop: function (e, ui) {
            //ui.item.parents('.psgTable').children().find('>tr:not(.ui-sortable)').fadeTo('normal', 1);

            // Get new order
            var facetShow = [];
            ui.item.parents(_$psgTable).children().find('>tr.ui-sortable >th').each(function(index, item) {
              if ($(item).attr('id') !== _id) {
                facetShow.push($(item).attr('id'));
                $(item).attr('style', '');
              }
            });
            scope.changefacetShow(facetShow);
          }
      });


    }
  }
}]);



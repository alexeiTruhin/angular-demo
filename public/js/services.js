'use strict';

/* Services */

var psgServices = angular.module('psgServices', []);

psgServices.factory('Data', ['$resource',
  function($resource){
    return $resource('data/?:url', {}, {
      query: {method:'GET', params:{}}
    });
  }]);
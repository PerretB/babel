(function() {

  var dependencies = [
    "babel.ide",
    "babel.cmd",
    "babel.compile"
  ];

  var module = angular.module("babel.exercice", dependencies);

  module.directive("exercice", [
    "$compileJS",
    function($compileJS) {
      return {
        "restrict":"E",
        "scope":{
          "category":"@",
          "title":"@"
        },
        "templateUrl":"templates/exercice.html",
        "link": function(scope, iElem, iAttrs) {

          scope.$cmdContent = "";

          scope.$execute = function() {
            scope.$cmdContent = $compileJS.$execute(scope.$code);
          };

        }
      };
    }]);

})();

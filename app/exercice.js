(function() {

  var dependencies = [
    "babel.ide",
    "babel.cmd",
    "babel.script"
  ];

  var module = angular.module("babel.exercice", dependencies);

  module.directive("exercice", [
    "$scripts",
    function($scripts) {
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
            $script = $scripts.$build(scope.$code);
            $script.$walkAst(function() {
              console.log(this);
            });
            $script.$run();
            scope.$cmdContent = $script.$cmd();
          };

        }
      };
    }]);

})();

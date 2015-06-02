(function() {

      var dependencies = [
            "babel.ide",
            "babel.cmd"
      ];

      var module = angular.module("babel.exercice", dependencies);

      module.directive("exercice", function() {
            return {
                  "restrict":"E",
                  "scope":{
                        "category":"@",
                        "title":"@"
                  },
                  "templateUrl":"templates/exercice.html",
                  "link": function(scope, iElem, iAttrs) {
                        
                        scope.$cmdContent = "";
                        
                        var initInterpreter = function(interpreter, codeScope) {

                              scope.$cmdContent = "";

                              var wrapper = function(text) {
                                    text = text ? text.toString() : '';
                                    if(scope.$cmdContent == "") {
                                          scope.$cmdContent = text;
                                    }
                                    else {
                                          scope.$cmdContent = scope.$cmdContent + "\n" + text;
                                    }
                              };
                              
                              interpreter.setProperty(codeScope, 'alert',
                                  interpreter.createNativeFunction(wrapper)
                              );
                              
                        };
                  
                        scope.$execute = function() {
                              try {
                                    interpreter = new Interpreter(scope.$code, initInterpreter);
                                    interpreter.run();
                              }
                              catch (e) {
                                    scope.$cmdContent = "" + e;
                              }
                        };
                        
                        
                  }
            };    
      });

})();

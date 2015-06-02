(function() {

      var dependencies = [
      
      ];

      var module = angular.module("babel.ide", dependencies);

      module.directive("ide", function() {
            return {
                  "restrict":"E",
                  "require":"?ngModel",
                  "scope":{
                        "language":"@",
                        "autofocus":"@"
                  },
                  "template":"<textarea class=\"ide\"></textarea>",
                  "link": function(scope, iElem, iAttrs, ngModelCtrl) {
                        
                        var ide = CodeMirror.fromTextArea(iElem.find("textarea")[0], {
                              lineNumbers: true,
                              mode: scope.language,
                              matchBrackets: true,
                              autofocus: scope.autofocus
                        });
                        
                        if(angular.isDefined(ngModelCtrl)) {
                              
                              ide.on("change", function(changes) {
                                    ngModelCtrl.$setViewValue(
                                          ide.getValue()
                                    );
                              });
                              
                        }
                        
                  }
            };    
      });

})();

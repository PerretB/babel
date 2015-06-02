(function() {

      var dependencies = [
      
      ];

      var module = angular.module("babel.cmd", dependencies);

      module.directive("cmd", function() {
            return {
                  "restrict":"E",
                  "scope":{
                        "content":"="
                  },
                  "template":"<textarea class=\"cmd\"></textarea>",
                  "link": function(scope, iElem, iAttrs, ngModelCtrl) {
                        
                        var cmd = CodeMirror.fromTextArea(iElem.find("textarea")[0], {
                              lineNumbers: true,
                              mode: "text",
                              matchBrackets: true,
                              autofocus: false,
                              theme: "blackboard",
                              readOnly: true
                        });
                        
                        scope.$watch("content", function(newValue) {
                              if(angular.isDefined(newValue)) {
                                    cmd.setValue(newValue);
                              }
                              else {
                                    cmd.setValue("");
                              }
                        });
                        
                  }
            };    
      });

})();

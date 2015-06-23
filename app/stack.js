(function() {

      var dependencies = [
      
      ];

      var module = angular.module("babel.stack", dependencies);

      module.directive("stack", function() {
            return {
                  "restrict":"E",
                  "scope":{
                        "messages":"="
                  },
                  "template": "<fieldset><legend><div class=\"fa fa-align-justify\"></div> Pile d'appel</legend><ul><li ng-repeat=\"key in messages track by $index\">{{key}}</li></ul></fieldset>"
            };    
      });

})();

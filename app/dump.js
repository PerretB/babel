(function() {

      var dependencies = [
      
      ];

      var module = angular.module("babel.dump", dependencies);

      module.directive("dump", function() {
            return {
                  "restrict":"E",
                  "scope":{
                        "messages":"="
                  },
                  "template":"<ul><li ng-repeat=\"(key,value) in messages\">{{key}} : {{value}}</li></ul>"
            };    
      });

})();

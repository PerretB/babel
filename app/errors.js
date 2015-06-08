(function() {

      var dependencies = [
      
      ];

      var module = angular.module("babel.errors", dependencies);

      module.directive("errors", function() {
            return {
                  "restrict":"E",
                  "scope":{
                        "messages":"="
                  },
                  "template":"<ul><li ng-repeat=\"message in messages\">{{message}}</li></ul>"
            };    
      });

})();

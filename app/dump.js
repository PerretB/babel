(function() {

      var dependencies = [
      
      ];

      var module = angular.module("babel.dump", dependencies);

      module.directive("dump", function() {
            return {
                  "restrict":"E",
                  "scope":{
                        "local":"=",
						"global":"="
                  },
				  "template":"<fieldset><legend><div class=\"fa fa-binoculars\"></div> &Eacute;tat des variables globales</legend><ul><li ng-repeat=\"(key,value) in global\">{{key}} = {{value}}</li></ul></fieldset><fieldset><legend><div class=\"fa fa-binoculars\"></div> &Eacute;tat des variables locales</legend><ul><li ng-repeat=\"(key,value) in local\">{{key}} = {{value}}</li></ul></fieldset>"
            };    
      });

})();

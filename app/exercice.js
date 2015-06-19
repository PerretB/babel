(function() {

	var dependencies = [
		"babel.editor",
		"babel.execution",
		"babel.cmd",
		"babel.script",
		"babel.errors"
	];

	var module = angular.module("babel.exercice", dependencies);

	module.factory("Exercice", ["Script", "ExecutionSession", function(Script, ExecutionSession) {

		function Exercice() {
			this.constraints  = [];
			this.tests    	  = [];
			this.script       = new Script();
			this.errors				= [];
		}

		Exercice.prototype.unitTest = function(callback) {
				this.unitTests.push(callback);
		};

		Exercice.prototype.constraint = function(query) {
				this.constraints.push(query);
		};

		Exercice.prototype.validate = function() {

			this.errors = [];

			if(!this.script.isValid()) {
				this.errors = ["Il y a des erreurs de syntaxe !"];
				return false;
			}

			angular.forEach(this.constraints, function(constraint) {
				var result = this.script.ast.validate(constraint);

				if(!result.isValid()) {
						result.each(function() {
							this.errors.push(this.error);
						});
				}
			});

			if(this.errors.length > 0) {
				return false;
			}

			angular.forEach(this.tests, function(unitTest) {
				if(!unitTest.apply(this)) {
					return false;
				}
			});

			return true;

		};

		Exercice.prototype.init = function() {
			this.script = new Script(this.initialCode);
		};

		return Exercice;

	}]);

	module.directive("exercice", [
		"Script",
		"Exercice",
		function(Script, Exercice) {
			return {
				"restrict":"E",
				"scope":{
					"category":"@",
					"title":"@"
				},
				"templateUrl":"templates/exercice.html",
				"link": function(scope, iElem, iAttrs) {

					scope.exercice = new Exercice();
					scope.exercice.script = new Script(
						"function sort(array) {\n\n}"
					);

					scope.exercice.script.lockLine(0);
					scope.exercice.script.lockLine(2);

					scope.exercice.constraint('root . function sort [error:"Il n\'y a pas de fonction sort."] [named:premiereErreur] with { root . return } [error:"La fonction sort ne retourne rien."] [named:secondeErreur ]');


					//scope.$$cmdContent = "";
					//scope.$$script = new Script();


							/*scope.$cmdContent = "";

							scope.$errors = [];



							scope.$compile = function() {
								scope.$script = $scripts.$build(scope.$code);
	              errors = scope.$script.$ast().validate(test);

								var functions = scope.$script.$ast().find("root > Statement").nodes;
								var node = functions[0];

	              msgs = [];

								console.log(scope.$script.$call("SimplePrint", 1, 2, 3));
								console.log(scope.$script.$call("SimplePrint", "bla", [0,1], {do:"it"}));

								/*console.log(scope.$script.$do("SimplePrint(2,3,4);"));
								console.log(scope.$script.$do("SimplePrint(4,5,6);"));
								console.log(scope.$script.$do("SimplePrint(7,8,9);"));*/

	              /*errors.each(function() {
	                 msgs.push(this.error);
	              });

	              scope.$errors = msgs;

	              if(scope.$errors.length > 0) {
	                  scope.$script = null;
	              }*/
							/*};

							scope.$execute = function() {
								scope.$script.$run();
								scope.$cmdContent = scope.$script.$cmd();
								scope.$script = null;
							};*/

				}
			};
		}]);

})();

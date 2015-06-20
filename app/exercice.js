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
						"function sort(array) {\n\n}",
						"javascript"
					);

					scope.exercice.script.lockLine(0);
					scope.exercice.script.lockLine(2);

					scope.exercice.constraint('root . function sort [error:"Il n\'y a pas de fonction sort."] [named:premiereErreur] with { root . return } [error:"La fonction sort ne retourne rien."] [named:secondeErreur ]');

					scope.$execute = function() {
						if(scope.exercice.script.isValid()) {
							exec = scope.exercice.script.createExecutionSession();
							exec.run();
							scope.$$cmdContent = exec.out();
						}
					};

				}
			};
		}]);

})();

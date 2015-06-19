(function() {

	var dependencies = [
		"babel.editor",
		"babel.cmd",
		"babel.script",
		"babel.errors"
	];

	var module = angular.module("babel.exercice", dependencies);

	/*module.factory("Exercice", ["Script", "ExecutionSession", function() {

		function Exercice() {
			this.initialCode  = "";
			this.lockedLines  = [];
			this.codeQueries  = [];
			this.unitTests    = [];
			this.script       = null;
		}

		Exercice.prototype.addUnitTest = function(callback) {
				this.unitTests.append(callback);
		};

		Exercice.prototype.validate = function() {

		};

		Exercice.prototype.init = function() {
			this.script = new Script(this.initialCode);
		};

		return Exercice;

	}]);*/

	module.directive("exercice", [
		"Script",
		function(Script) {
			return {
				"restrict":"E",
				"scope":{
					"category":"@",
					"title":"@"
				},
				"templateUrl":"templates/exercice.html",
				"link": function(scope, iElem, iAttrs) {

					scope.script = new Script(
						"function sort(array) {\n\n}"
					);

					scope.script.lockLine(0);
					scope.script.lockLine(2);

					var test = 'root ' +
									   '. function sort 			 [error:"Il n\'y a pas de fonction sort."   ] [named:premiereErreur] ' +
									   'with { root . return } [error:"La fonction sort ne retourne rien."] [named:secondeErreur ]';



					//scope.$$cmdContent = "";
					//scope.$$script = new Script();

					/*scope.$watch('code', function(newCode) {
						scope.$$script.parse(newCode);
						scope.$$isValid = scope.$$script.isValid();
					});*/

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

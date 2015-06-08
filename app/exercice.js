(function() {

	var dependencies = [
		"babel.editor",
		"babel.cmd",
		"babel.script"
	];

	var module = angular.module("babel.exercice", dependencies);

	module.directive("exercice", [
		"$scripts",
		"$editors",
		function($scripts, $editors) {
			return {
				"restrict":"E",
				"scope":{
					"category":"@",
					"title":"@"
				},
				"templateUrl":"templates/exercice.html",
				"link": {
					pre: function(scope, iElem, iAttrs) {

						scope.$editor = $editors.$new();

					},

					post: function(scope, iElem, iAttrs) {

						scope.$cmdContent = "";
						scope.$script = null;

						scope.$watch('$code', function() {
							scope.$script = null;
						});

						scope.$compile = function() {
							scope.$script = $scripts.$build(scope.$code);
						};

						scope.$execute = function() {
							scope.$script.$run();
							scope.$cmdContent = scope.$script.$cmd();
							scope.$script = null;
						};

						scope.$next = function() {
							node = scope.$script.$nextNode();
							if(angular.isDefined(node)) {
								node = node.node;
								scope.$editor.$select(
									scope.$editor.$toPosition(node.start),
									scope.$editor.$toPosition(node.end)
								);
							}

							if(!scope.$script.$step()) {
								scope.$cmdContent = scope.$script.$cmd();
								scope.$script = null;
							}
							else {
								scope.$cmdContent = scope.$script.$cmd();
							}
						};

						scope.$editor.$concat("function sort (toSort) {");
						scope.$editor.$concat("");
						scope.$editor.$concat("	var result = [];");
						scope.$editor.$concat(" ");
						scope.$editor.$concat("	function test() {};");
						scope.$editor.$concat(" ");
						scope.$editor.$concat("	return result;");
						scope.$editor.$concat("");
						scope.$editor.$concat("}");

						scope.$editor.$lockLine(0);
						scope.$editor.$lockLine(1);
						scope.$editor.$lockLine(2);
						scope.$editor.$lockLine(6);
						scope.$editor.$lockLine(8);

						$script = $scripts.$build(scope.$editor.$content());
						var validator = ValidatorBuilder.parse('root . function sort with error message "Il n\'y a pas de fonction sort." as premiereErreur . return with error message "La fonction sort ne retourne rien." as secondeErreur');
						console.log(validator.find($script.$ast()));
						validator.validate($script.$ast()).each(function() {
							console.log(this);
						});

						validator = ValidatorBuilder.parse("root > function . return"); //with error message \"Pas trouvé ton truc !\"
						console.log(validator.find($script.$ast()));

					}
				}
			};
		}]);

})();

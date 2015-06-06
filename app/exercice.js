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

						scope.$execute = function() {
							$script = $scripts.$build(scope.$code);
							$script.$walkAst(function() {
								console.log(this);
							});
							$script.$run();
							scope.$cmdContent = $script.$cmd();
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
						var validator = ValidatorBuilder.parse("root . function . return"); // with error message \"Pas trouvé ton truc !\""

						console.log(validator);
						console.log(validator.find($script.$ast()));

						validator = ValidatorBuilder.parse("root > function"); //with error message \"Pas trouvé ton truc !\"
						console.log(validator.find($script.$ast()));

					}
				}
			};
		}]);

})();

(function() {

	var dependencies = [

	];

	/**
	* Module regroupant les utilitaires pour gérer les editeurs de code.
	*/
	var module = angular.module("babel.editor", dependencies);

	/**
	*	@ngdoc directive
	* @scope
	*
	*	Directive permettant d'ajouter un éditeur de code.
	*
	*	@param @language langage reconnu par l'éditeur
	*	@param @autofocus (true/false) si le focus doit être porté sur l'éditeur
	* 										à sa création.
	* @param @service objet créée par le service $editors à lier à cette directive.
	*									(doit être créé en pré-linkage)
	*/
	module.directive("scriptEditor", ['Script', function(Script) {
		return {
			"restrict":"E",
			"scope":{
				"autofocus":"@",
				"script":"="
			},
			"template":"<textarea class=\"editor\"></textarea>",
			"link": function(scope, iElem, iAttrs) {

				// Création de l'éditeur CodeMirror
				scope.$$editor = CodeMirror.fromTextArea(iElem.find("textarea")[0], {
					lineNumbers: true,
					matchBrackets: true,
					autofocus: scope.autofocus,
					gutters: ["CodeMirror-linenumbers", "breakpoints"]
				});

				scope.$watch("script", function(newValue) {
					if(angular.isDefined(newValue) && angular.isDefined(newValue.$$code)) {
						scope.$$editor.swapDoc(newValue.$$code);
					}
					else {
						scope.$$editor.swapDoc(CodeMirror.Doc(""));
					}
				});

				scope.$$editor.on("change", function(changes) {
					scope.$apply(function() {
						if(angular.isDefined(scope.script)) {
							scope.script.parse();
						}
					});
				});

			}
		};
	}]);

})();

(function() {

	var dependencies = [
	
	];

	var module = angular.module("babel.editor", dependencies);

	module.service("$editors", function() {
		
		var Editor = function() {
			this.$document = null;
		};
		
		/**
		 * Vérifie si l'objet est initialisé, et donc utilisable.
		 * 
		 * @return boolean true si l'objet est initialisé.
		 */
		Editor.prototype.$initialized = function() {
			return angular.isDefined(this.$document);
		};
		
		/**
		 * Concatène le contenu de l'éditeur avec du nouveau
		 * contenu.
		 * 
		 * @param string text
		 * 	Texte à concaténer.
		 */
		Editor.prototype.$concat = function(text) {
			if(this.$document.getValue() == "") {
				this.$document.setValue(text);
			}
			else {
				this.$document.setValue(this.$document.getValue() + "\n" + text);
			}
		};
		
		/**
		 * Récupérer ou changer le contenu de l'editeur.
		 * 
		 * @param string (optional) text
		 * 	Si renseigné, cette méthode se comporte comme un setter.
		 * 
		 * @return string le contenu de l'editeur s'il n'a pas été modifié.
		 */
		Editor.prototype.$content = function(text) {
			if(angluar.isDefined(text)) {
				this.$document.setValue(text);
			}
			else {
				return this.$document.getValue();
			}
		};
		
		this.$new = function() {
			return new Editor();
		};
		
		return this;
		
	});

	module.directive("editor", function() {
		return {
			"restrict":"E",
			"require":"?ngModel",
			"scope":{
				"language":"@",
				"autofocus":"@",
				"service":"="
			},
			"template":"<textarea class=\"editor\"></textarea>",
			"link": function(scope, iElem, iAttrs, ngModelCtrl) {
				
				var cmDocument = CodeMirror.fromTextArea(iElem.find("textarea")[0], {
					lineNumbers: true,
					mode: scope.language,
					matchBrackets: true,
					autofocus: scope.autofocus
				});
				
				if(angular.isDefined(scope.service)) {
					scope.service.$document = cmDocument;
				}
				
				if(angular.isDefined(ngModelCtrl)) {
					
					cmDocument.on("change", function(changes) {
						ngModelCtrl.$setViewValue(
							cmDocument.getValue()
						);
					});
					
				}
					
			}
		};
	});

})();

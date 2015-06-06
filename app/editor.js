(function() {

	var dependencies = [

	];

	var module = angular.module("babel.editor", dependencies);

  /**
	 *	@ngdoc service
	 *
	 *		Service permettant de contrôler les directives éditeurs depuis
	 *	d'autres éléments d'angular.
	 */
	module.service("$editors", function() {

		/**
		 *	@ngdoc object
		 *
	   *	Objet permettant de manipuler une directive editor à distance.
		 */
		var Editor = function() {
			this.$document = null;
		};

		/**
		 *	@ngdoc method
		 *
		 *	Vérifie si l'objet est initialisé, et donc utilisable.
		 *
		 *	@return boolean true si l'objet est initialisé.
		 */
		Editor.prototype.$initialized = function() {
			return angular.isDefined(this.$document);
		};

		/**
		 *	@ngdoc method
		 *
		 *	Permet de bloquer une ligne de l'éditeur.
		 *
		 *	@param number lineNumber Numéro de la ligne à bloquer.
		 */
		Editor.prototype.$lockLine = function(lineNumber) {
			this.$document.lockLine(lineNumber);
		};

		/**
		 *	@ngdoc method
		 *
		 *	Permet de débloquer une ligne de l'éditeur.
		 *
		 *	@param number lineNumber Numéro de la ligne à débloquer.
		 */
		Editor.prototype.$unlockLine = function(lineNumber) {
			this.$document.unlockLine(lineNumber);
		};

		/**
		 *	@ngdoc method
		 *
		 *	Concatène le contenu de l'éditeur avec du nouveau
		 *	contenu.
		 *
		 *	@param string text
		 *		Texte à concaténer.
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
		 *	@ngdoc method
		 *
		 *	Récupérer ou changer le contenu de l'editeur.
		 *
		 *	@param string (optional) text
		 *		Si renseigné, cette méthode se comporte comme un setter.
		 *
		 *	@return string le contenu de l'editeur s'il n'a pas été modifié.
		 */
		Editor.prototype.$content = function(text) {
			if(angular.isDefined(text)) {
				this.$document.setValue(text);
			}
			else {
				return this.$document.getValue();
			}
		};

		/**
		 *	@ngdoc method
		 *	Créée un nouvel objet Editor à passer en paramètre d'une directive editor.
		 *
		 *	@return Editor un nouvel objet editor.
		 */
		this.$new = function() {
			return new Editor();
		};

		return this;

	});

	/**
	 *	@ngdoc directive
	 *  @scope
	 *
	 *	Directive permettant d'ajouter un éditeur de code.
	 *
	 *	@param @language langage reconnu par l'éditeur
	 *	@param @autofocus (true/false) si le focus doit être porté sur l'éditeur
	 * 										à sa création.
	 *  @param @service objet créée par le service $editors à lier à cette directive.
	 *									(doit être créé en pré-linkage)
	 */
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

				// Création de l'editeur CodeMirror
				var cmDocument = CodeMirror.fromTextArea(iElem.find("textarea")[0], {
					lineNumbers: true,
					mode: scope.language,
					matchBrackets: true,
					autofocus: scope.autofocus
				});

				// Si on veut binder un service
				if(angular.isDefined(scope.service)) {
					scope.service.$document = cmDocument;
				}

				// Si une directive ng-model est définie
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

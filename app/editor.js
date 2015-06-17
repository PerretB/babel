(function() {

	var dependencies = [

	];

	/**
	* Module regroupant les utilitaires pour gérer les editeurs de code.
	*/
	var module = angular.module("babel.editor", dependencies);

	module.factory("Editor", function() {

		/**
		 *	@ngdoc object
		 *
	   *	Objet permettant de manipuler une directive editor à distance.
		 */
		var Editor = function() {
			this.$$editor = null;
			this.$$onInit = [];
		};

		Editor.prototype.onInit = function(callback) {
			this.$$onInit.push(callback);
		};

		Editor.prototype.register = function(editor) {
			this.$$editor = editor;
			for(var i = 0; i < this.$$onInit.length; ++i) {
				this.$$onInit[i].call(this);
			}
		};

		/**
		 *	@ngdoc method
		 *
		 *	Permet de bloquer une ligne de l'éditeur.
		 *
		 *	@param number lineNumber Numéro de la ligne à bloquer.
		 */
		Editor.prototype.lockLine = function(lineNumber) {
			this.$$editor.lockLine(lineNumber);
		};

		/**
		 *	@ngdoc method
		 *
		 *	Permet de marquer une ligne de l'éditeur (en tant que prochaine instruction à exécuter).
		 *
		 *	@param number lineNumber Numéro de la ligne à marquer.
		 */
		Editor.prototype.markLine = function(lineNumber) {
			this.$$editor.markLine(lineNumber);
		};

		/**
		 *	@ngdoc method
		 *
		 *	Permet de démarquer une ligne de l'éditeur (en tant que prochaine instruction à exécuter).
		 *
		 *	@param number lineNumber Numéro de la ligne à démarquer.
		 */
		Editor.prototype.unmarkLine = function(lineNumber) {
			this.$$editor.unmarkLine(lineNumber);
		};

		/**
		 *	@ngdoc method
		 *
		 *	Permet de débloquer une ligne de l'éditeur.
		 *
		 *	@param number lineNumber Numéro de la ligne à débloquer.
		 */
		Editor.prototype.unlockLine = function(lineNumber) {
			this.$$editor.unlockLine(lineNumber);
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
		Editor.prototype.concat = function(text) {
			if(this.$$editor.getValue() == "") {
				this.$$editor.setValue(text);
			}
			else {
				this.$$editor.setValue(this.$$editor.getValue() + "\n" + text);
			}
		};

		/**
		* Transforme une position buffer en position curseur.
		*/
		Editor.prototype.toPosition = function(ch) {
			return this.$$editor.findPosH({line:0, ch:0}, ch, 'char');
		};

		/**
		* Changer la sélection de l'éditeur.
		*/
		Editor.prototype.select = function(start, end) {
			this.$$editor.setSelection(start, end);
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
		Editor.prototype.content = function(text) {
			if(angular.isDefined(text)) {
				this.$$editor.setValue(text);
			}
			else {
				return this.$$editor.getValue();
			}
		};

		return Editor;

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
				"useController":"="
			},
			"template":"<textarea class=\"editor\"></textarea>",
			"link": function(scope, iElem, iAttrs, ngModelCtrl) {

				// Création de l'éditeur CodeMirror
				scope.$$editor = CodeMirror.fromTextArea(iElem.find("textarea")[0], {
					lineNumbers: true,
					mode: scope.language,
					matchBrackets: true,
					autofocus: scope.autofocus,
					gutters: ["CodeMirror-linenumbers", "breakpoints"]
				});

				scope.$watch("useController", function(newController) {
					scope.$$lastController = newController;
					newController.register(scope.$$editor);
				});

				// Si une directive ng-model est définie
				if(angular.isDefined(ngModelCtrl)) {

					scope.$$editor.on("change", function(changes) {
						ngModelCtrl.$setViewValue(
							scope.$$editor.getValue()
						);
					});

				}

			}
		};
	});

})();

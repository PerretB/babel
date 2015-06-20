(function() {

	var dependencies = [
		"babel.jstools",
		"babel.ast",
		"babel.execution"
	];

	/**
	* Ce module regroupe les objets utiles à l'analyse des scripts.
	*/
	var module = angular.module("babel.script", dependencies);

	/**
	* L'objet script, permet d'analyser et créer des sessions d'exécution d'un
	* script.
	*/
	module.factory("Script", ["AST", "$JSParse", "ExecutionSession", function(AST, $JSParse, ExecutionSession) {

		var Script = function(code, language) {
			this.$$code = CodeMirror.Doc(code || "", language);
			this.$$language = language;
			this.ast = undefined;
			this.error = undefined;
		};

		Script.prototype.language = function(language) {
			if(angular.isDefined(language)) {
				this.$$code = CodeMirror.Doc(this.content(), language);
				this.$$language = language;
			}
			else {
				return this.$$language;
			}
		};

		/**
		 *	@ngdoc method
		 *
		 *	Permet de bloquer une ligne de l'éditeur.
		 *
		 *	@param number lineNumber Numéro de la ligne à bloquer.
		 */
		Script.prototype.lockLine = function(lineNumber) {
			this.$$code.lockLine(lineNumber);
		};

		/**
		 *	@ngdoc method
		 *
		 *	Permet de marquer une ligne de l'éditeur (en tant que prochaine instruction à exécuter).
		 *
		 *	@param number lineNumber Numéro de la ligne à marquer.
		 */
		Script.prototype.markLine = function(lineNumber) {
			this.$$code.markLine(lineNumber);
		};

		/**
		 *	@ngdoc method
		 *
		 *	Permet de démarquer une ligne de l'éditeur (en tant que prochaine instruction à exécuter).
		 *
		 *	@param number lineNumber Numéro de la ligne à démarquer.
		 */
		Script.prototype.unmarkLine = function(lineNumber) {
			this.$$code.unmarkLine(lineNumber);
		};

		/**
		 *	@ngdoc method
		 *
		 *	Permet de débloquer une ligne de l'éditeur.
		 *
		 *	@param number lineNumber Numéro de la ligne à débloquer.
		 */
		Script.prototype.unlockLine = function(lineNumber) {
			this.$$code.unlockLine(lineNumber);
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
		/*Editor.prototype.concat = function(text) {
			if(this.$$code.getValue() == "") {
				this.$$code.setValue(text);
			}
			else {
				this.$$code.setValue(this.$$code.getValue() + "\n" + text);
			}
		};*/

		/**
		* Transforme une position buffer en position curseur.
		*/
		Script.prototype.toPosition = function(ch) {
			return this.$$code.findPosH({line:0, ch:0}, ch, 'char');
		};

		/**
		* Changer la sélection de l'éditeur.
		*/
		Script.prototype.select = function(start, end) {
			this.$$code.setSelection(start, end);
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
		Script.prototype.content = function(text) {
			if(angular.isDefined(text)) {
				this.$$code.setValue(text);
				this.parse();
			}
			else {
				return this.$$code.getValue();
			}
		};

		/**
		* Parse du nouveau code pour pouvoir utiliser l'arbre syntaxique par la
		* suite.
		*
		* @param string code
		*		Code à parser.
		*
		* @return boolean true s'il n'y a pas d'erreur de syntaxe.
		*/
		Script.prototype.parse = function(code) {

			if(angular.isDefined(code)) {
				this.$$code.setValue(code);
			}
			else {
				code = this.$$code.getValue();
			}

			var result = true;

			try {
				var parsedAST = $JSParse(code);
				this.ast = new AST(parsedAST);
				this.error = undefined;
			}
			catch(e) {
				this.ast = undefined;
				this.error = e;
				result = false;
			}
			finally {
				return result;
			}

		};

		/**
		* Instancie une nouvelle session d'exécution.
		*
		* Si une erreur syntaxique existe dans le script, cette méthode
		* retournera null.
		*
		* @return ExecutionSession Session d'exécution du script.
		*/
		Script.prototype.createExecutionSession = function() {
			if(angular.isDefined(this.ast)) {
				return new ExecutionSession(this);
			}
			else {
				return null;
			}
		};

		/**
		* @return boolean true si le script est syntaxiquement correct.
		*/
		Script.prototype.isValid = function() {
			return angular.isDefined(this.ast);
		};

		return Script;

	}]);

})();

(function() {

	var dependencies = [
		"babel.jstools",
		"babel.ast"
	];

	/**
	* Ce module regroupe les objets utiles à l'analyse des scripts.
	*/
	var module = angular.module("babel.script", dependencies);

	/**
	* L'objet script, permet d'analyser et créer des sessions d'exécution d'un
	* script.
	*/
	module.factory("Script", ["AST", "$JSParse", function(AST, $JSParse) {

		var Script = function() {
			this.code = "";
			this.ast = undefined;
			this.error = undefined;
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

			var result = true;
			this.code = code;

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
		* Créée une nouvelle session d'exécution.
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

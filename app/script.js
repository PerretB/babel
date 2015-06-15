(function() {

	var dependencies = [
		"babel.ast"
	];

	var module = angular.module("babel.script", dependencies);

	module.service("$scripts", ["$AST", function($AST) {

		/**
		* Initialise un interpréteur, et ajoute la fonction alert/print
		*/
		var initInterpreter = function(interpreter, codeScope) {

			interpreter.cmd = "";

			var wrapper = function(text) {
				text = text ? text.toString() : '';
				if(interpreter.cmd == "") {
					interpreter.cmd = text;
				}
				else {
					interpreter.cmd = interpreter.cmd + "\n" + text;
				}
			};

			interpreter.setProperty(codeScope, 'alert',
				interpreter.createNativeFunction(wrapper)
			);

			interpreter.setProperty(codeScope, 'print',
				interpreter.createNativeFunction(wrapper)
			);

		};

		/**
		* @class Script
		*
		* Surcouche à l'interpreteur JS, permet de l'utiliser de manière abstraite.
		*/
		var Script = function(code) {
			this.$code = code;
			this.$start();
		};

		Script.prototype.$start = function() {
			try {
				this.$interpreter = new Interpreter(this.$code, initInterpreter);
			}
			catch(e) {
				this.$interpreter = undefined;
				this.$error = e;
			}
			finally {}
		};

		/**
		* Execute l'instruction suivante.
		* @return boolean false s'il n'existe plus d'instruction.
		*/
		Script.prototype.$step = function () {
			if(angular.isDefined(this.$interpreter)) {
				return this.$interpreter.step();
			}
			else {
				return false;
			}
		};

		/**
		 * Test un script.
		 */
		Script.prototype.$test = function(test) {
			var validator = ValidatorBuilder.parse(test);
			return validator.validate(this.$ast());
		};

		/**
		* Execute le script, et retourne le résultat.
		*
		* @todo Penser à améliorer la méthode pour éviter les problèmes de boucles infinies.
		* @return Object résultat de l'exécution.
		*/
		Script.prototype.$run = function() {
			if(angular.isDefined(this.$interpreter)) {
				try {
					while(this.$step());
					return this.$interpreter.value;
				}
				catch(e) {
					this.$interpreter.cmd += "\n" + e;
					return null;
				}
			}
			else {
				return null;
			}
		};

		/**
		* @return les logs de l'exécution.
		*/
		Script.prototype.$cmd = function() {
			if(angular.isDefined(this.$interpreter)) {
				return this.$interpreter.cmd || "";
			}
			else {
				return this.$error + "";
			}
		};

		/**
		* @return Array pile d'instructions.
		*/
		Script.prototype.$stack = function() {
			if(angular.isDefined(this.$interpreter)) {
				return this.$interpreter.stateStack;
			}
			else {
				return null;
			}
		};

		function toObject(value) {
			if(value.isPrimitive) {
				return value.data;
			}
			else {
				var result = {};

				for(var key in value.properties) {
						result[key] = toObject(value.properties[key]);
				}

				return result;
			}
		}

		Script.prototype.$call = function(functionName) {

			var query = functionName;

			var queryArgs = [];

			for(var i = 1; i < arguments.length; ++i) {
				queryArgs.push(JSON.stringify(arguments[i]));
			}

			query += "( " + queryArgs.join(', ') + " );";

			return this.$do(query);

		}

		Script.prototype.$do = function(code) {

			$tmpScript = new Script(code);

			$expression = $tmpScript.$ast().find("root > Expression");

			this.$start();

			do {
				this.$step();
			} while(!this.$nextNode().is('program'));

			this.$interpreter.stateStack.unshift({node:$expression.nodes[0].$$node});

			this.$run();

			var value = this.$interpreter.value;

			if(value.isPrimitive) {
				value = {cmd:this.$cmd(), returned:value.valueOf()};
			}
			else {
				value = {cmd:this.$cmd(), returned:toObject(value)};
			}

			this.$start();
			return value;

		};

		/**
		* @return Object prochain noeud exécuté.
		*/
		Script.prototype.$nextNode = function() {
			if(angular.isDefined(this.$interpreter) && this.$interpreter.stateStack.length > 0) {
				return $AST.$createNode(this.$interpreter.stateStack[0].node);
			}
			else {
				return null;
			}
		};

		/**
		* @return L'abstract Syntax Tree du script.
		*/
		Script.prototype.$ast = function() {
			if(angular.isDefined(this.$interpreter)) {
				return $AST.$create(this.$interpreter.ast);
			}
			else {
				return null;
			}
		};

		/**
		* Créer un nouvel objet script.
		*
		* @param string code
		*   Code du script
		*
		* @return Script le script.
		*/
		this.$build = function(code) {
			return new Script(code);
		};

		return this;

	}]);

})();

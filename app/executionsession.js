(function() {

	var dependencies = [
		"babel.ast",
    "babel.jstools",
    "babel.script"
	];

  /**
  * Ce module regroupe les utilitaires liés à l'exécution.
  */
	var module = angular.module("babel.execution", dependencies);

	module.factory("ExecutionSession", ["Interpreter", "AST", "Node", "$JSParse", function(Interpreter, AST, Node, $JSParse) {

    /**
    * Permet de transformer une valeur de l'interpreteur en valeur JS.
    */
    function toObject(value) {

      if(!angular.isDefined(value)) {
        return null;
      }
			else if(value.isPrimitive) {
				return value.data;
			}
			else {

			 	if (value.toString().indexOf("[object]") == 0) {
					var result = {};

					for(var key in value.properties) {
							result[key] = toObject(value.properties[key]);
					}

					return result;
			 	}
			 	else {
					var result = [];

					for(var key in value.properties) {
							result.push(toObject(value.properties[key]));
					}

					return result;
				}

			}
		}

	/**
    * Permet de transformer une valeur de l'interpreteur en chaine de caractères.
    */
    function toString(value) {
      if(!angular.isDefined(value)) {
        return null;
      }
			else if(value.isPrimitive) {
				if (value.type == "string")
					return "'"+value.data+"'";
				else
					return value.data;
			}
			else {
				var result = "[";

				// Dictionnaire ?
				if (Object.keys(value.properties)[0] != 0) {
					for(var key in value.properties)
						result += "'"+key+"':"+toString(value.properties[key])+",";
				}
				// Array
				else {
					for(var key in value.properties)
						result += toString(value.properties[key])+",";
				}


				if (result[result.length-1] == ',')
					result = result.substring(0,result.length-1);

				result+="]";

				return result;
			}
		}

    /**
		* Initialise un interpréteur, et ajoute la fonction alert/print
		*/
		var initInterpreter = function(interpreter, codeScope) {

			interpreter.out = "";

			var wrapper = function(text) {
				text = text ? text.toString() : '';
				if(interpreter.out == "") {
					interpreter.out = text;
				}
				else {
					interpreter.out = interpreter.out + "\n" + text;
				}
			};

			interpreter.setProperty(codeScope, 'alert',
				interpreter.createNativeFunction(wrapper)
			);

			interpreter.setProperty(codeScope, 'print',
				interpreter.createNativeFunction(wrapper)
			);

		};

    var ExecutionSession = function(script) {
      this.script = script;
      this.$$interpreter = new Interpreter(script.content(), initInterpreter);
    };

		/**
		* Execute l'instruction suivante.
		* @return boolean false s'il n'existe plus d'instruction.
		*/
    ExecutionSession.prototype.step = function () {
		    return this.$$interpreter.step();
		};

		/**
		* Execute le script, et retourne le résultat.
		*
		* @todo Penser à améliorer la méthode pour éviter les problèmes de boucles infinies.
		* @return Object résultat de l'exécution.
		*/
    ExecutionSession.prototype.run = function() {
				try {
					while(this.step());
					return toObject(this.$$interpreter.value);
				}
				catch(e) {
					this.cmd += "\n" + e;
					return null;
				}
		};

		/**
		* @return string la sortie du script.
		*/
    ExecutionSession.prototype.out = function() {
  		return this.$$interpreter.out || "";
		};

		/**
		* @return Object dump des variables
		*/
		ExecutionSession.prototype.dump = function() {
			if(angular.isDefined(this.$$interpreter)) {
				var nativeArguments = [ "Array","Boolean","Date","Function","Infinity","JSON","Math","NaN","Number","Object","RegExp","String","alert","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","eval","isFinite","isNaN","parseFloat","parseInt","print","self","undefined","unescape","window","arguments" ]

				var scope = this.$$interpreter.getScope();

				dictionary = {};
				for (key in scope.properties)
				{
					if (nativeArguments.indexOf(key) != -1 || scope.properties[key].type == "function" )
						continue;
					var value = toString(scope.properties[key]);
					if (angular.isDefined(value))
						dictionary[key] = value;
				}
				dictionary["global"] = ("window" in scope.properties)
				return dictionary;
			}
			else {
				return null;
			}
		};

		/**
		* @return Array pile d'instructions.
		*/
    ExecutionSession.prototype.stack = function(scope) {
				var Node = scope.$$exec.nextNode().$$parent;
				var node = Node.node;
				// Si le noeud est un appel a une fonction :
				if (angular.isDefined(node) && node.type == "CallExpression") {
					// Si la fonction a fini de s'exécuter, on la retire de la pile
					if (Node.doneExec !== undefined && Node.doneExec == true)
						scope.$stack.shift();
					// Si la fonction ne s'est pas encore exécutée et que tous les arguments ont été parsés, on l'ajoute dans la pile (avec ses arguments)
					else if (Node.func_ !== undefined && Node.n_ == node.arguments.length) {
							var str = "(";
							for (var i = 0; i < Node.arguments.length; ++i) {
								var arg = Node.arguments[i];
								str+=toString(arg);
								str=str+",";
							}
							str+=toString(Node.value);
							str+=")";
							scope.$stack.unshift(node.callee.name+str);
					}
				}
				return scope.$stack;
		};

    /**
    * Appelle une fonction du script et retourne le résultat de
    * son appel.
    *
    * Il vaut mieux appeller cette méthode après la méthode prepare.
    *
    * @param string functionName Nom de la fonction à appeller.
    *
    * @param ... Arguments.
    *
    * @return Valeur de retour de l'appel à la fonction.
    */
    ExecutionSession.prototype.call = function(functionName) {

			var query = functionName;
			var queryArgs = [];

			for(var i = 1; i < arguments.length; ++i) {
				queryArgs.push(JSON.stringify(arguments[i]));
			}

			query += "( " + queryArgs.join(', ') + " );";

			return this.$$do(query);

		};

    /**
    * Execute la partie principale du script et attend de nouvelles instructions,
    * utile pour interpréter les initialisations de fonctions avant de les appeller.
    *
    * @TODO améliorer
    */
    ExecutionSession.prototype.prepare = function() {
      do {
				this.step();
			} while(!this.nextNode().is('program'));
    };

    /**
    * Vide l'output du script.
    */
    ExecutionSession.prototype.$$flush = function() {
      var result = this.$$interpreter.out;
      this.$$interpreter.out = "";
      return result;
    };

    ExecutionSession.prototype.$$unflush = function(content) {
      this.$$interpreter.out = content;
    };

    /**
    * Execute une portion de code complémentaire.
    *
    * UNSAFE A MORT.
    */
    ExecutionSession.prototype.$$do = function(code) {

		  ast = new AST($JSParse(code));
			expression = ast.find("root > Expression");

      var lastOut = this.$$flush();

			this.$$interpreter.stateStack.unshift({node:expression.nodes[0].$$node});
			this.prepare();

			var value = this.$$interpreter.value;
      var out = this.out();

      this.$$unflush(lastOut);

			return {out:out, returned:toObject(value)};

		};

		/**
		* @return Object prochain noeud exécuté.
		*/
    ExecutionSession.prototype.nextNode = function() {
			if(this.$$interpreter.stateStack.length > 0) {
				return new Node(this.$$interpreter.stateStack[0].node, this.$$interpreter.stateStack[0]);
			}
			else {
				return null;
			}
		};

		return ExecutionSession;

  }]);

})();

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
				var result = {};

				for(var key in value.properties) {
						result[key] = toObject(value.properties[key]);
				}

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
      this.$$interpreter = new Interpreter(script.code, initInterpreter);
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
		* @return Array pile d'instructions.
		*/
    ExecutionSession.prototype.stack = function() {
		  return this.$$interpreter.stateStack;
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
      return result.
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
				return new Node(this.$$interpreter.stateStack[0].node);
			}
			else {
				return null;
			}
		};

  }]);

})();

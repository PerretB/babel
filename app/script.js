(function() {

  var dependencies = [

  ];

  var module = angular.module("babel.script", dependencies);

  module.service("$scripts", function() {

    /**
    * Initialise un interpréteur, et ajoute la fonction print.
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

      try {
        this.$interpreter = new Interpreter(code, initInterpreter);
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
    * Parcourt récursif
    */
    var $_walkAst = function(callback, node, args) {

      var continueWalk;

      // Appel du callback sur le noeud en cours
      if(angular.isDefined(args)) {
        continueWalk = callback.apply(node, args);
      }
      else {
        continueWalk = callback.call(node, node);
      }

      // Si pas de body, ou demande d'arrêt retour.
      if (continueWalk === false || !angular.isDefined(node.body)) {
        return;
    	}
      else if (Array.isArray(node.body)) {
        for (var i = 0; i < node.body.length; ++i) {
          $_walkAst(callback, node.body[i], args);
        }
      }
      else {
        for (var i = 0; i < node.body.body.length; ++i) {
          $_walkAst(callback, node.body.body[i], args);
        }
      }

    };

    /**
    * Marche le long de l'AST et appelle une fonction sur
    * chaque noeud.
    *
    * @param callback fonction rappellée, this pour accéder au noeud, si retourne false, alors on arrête la marche dans la branche actuelle.
    */
    Script.prototype.$walkAst = function(callback, args) {
      $_walkAst(callback, this.$ast(), args);
    };

    /**
    * Vérifie qu'un noeud existe dans l'arbre.
    *
    * @param string type type de noeud.
    * @return boolean true si le noeud existe.
    */
    Script.prototype.$containsNode = function(type) {

      var result = false;

      this.$walkAst(function() {
        if(result) {
          return false;
        }
        else if(this.type == type) {
          result = true;
          return false;
        }
      });

      return result;

    };

    /**
    * Test l'existence d'une fonction.
    *
    * @param string functionName
    *   Nom de la fonction
    *
    * @return boolean true si la fonction existe.
    */
    Script.prototype.containsFunctionCall = function(functionName) {
      var result = false;

      this.$walkAst(function() {
        if(result) {
          return false;
        }

        if (this.type == 'ExpressionStatement') {
          if (this.expression.type == "CallExpression") {
            if (this.expression.callee.name == functionName) {
              result = true;
              return false;
            }
          }
        }
      });

      return result;
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

    /**
    * @return Object prochain noeud exécuté.
    */
    Script.prototype.$nextNode = function() {
      if(angular.isDefined(this.$interpreter)) {
        return this.$interpreter.stateStack[0];
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
        return this.$interpreter.ast;
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

  });

})();

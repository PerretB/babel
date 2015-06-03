(function() {

  var dependencies = [

  ];

  var module = angular.module("babel.script", dependencies);

  module.service("$script", function() {

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
      this.$interpreter = new Interpreter(code, initInterpreter);
    };

    /**
    * Execute l'instruction suivante.
    * @return boolean false s'il n'existe plus d'instruction.
    */
    Script.prototype.$step = function () {
      return this.$interpreter.step();
    };

    /**
    * Execute le script, et retourne le résultat.
    *
    * @todo Penser à améliorer la méthode pour éviter les problèmes de boucles infinies.
    * @return Object résultat de l'exécution.
    */
    Script.prototype.$run = function() {
      this.$interpreter.run();
      return this.$interpreter.value;
    };

    /**
    * @return les logs de l'exécution.
    */
    Script.prototype.$cmd = function() {
      return this.$interpreter.cmd || "";
    };

    /**
    * @return Array pile d'instructions.
    */
    Script.prototype.$stack = function() {
      return this.$interpreter.stateStack;
    };

    /**
    * @return L'abstract Syntax Tree du script.
    */
    Script.prototype.$ast = function() {
      return this.$interpreter.ast;
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

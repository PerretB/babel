(function() {

	var dependencies = [

	];

  /**
  * Module qui permet de wrapper les outils externes de acorn et NeilFraser
  * JS interpreter pour les utiliser dans l'injecteur de dépendences.
  */
	var module = angular.module("babel.jstools", dependencies);

  /**
  * Fonction permettant de parser du code JS (ACORN) à utiliser de la manière
  * suivante : $JSParse(code);
  */
	module.value("$JSParse", acorn.parse);

  /**
  * Objet interpreteur de NeilFraser JS Interpreter, à utiliser de la manière
  * suivante : new $Interpreter(code), ou new $Interpreter(code, initialiser).
  *
  * Voir le wiki de NeilFraser JS Interpreter pour plus de détails.
  */
  module.value("Interpreter", Interpreter);

})();

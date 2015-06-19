/**
 * Addon CodeMirror pour marquer des lignes dans l'ide.
 */
(function(mod) {
	if (typeof exports == "object" && typeof module == "object") // CommonJS
		mod(require("../../lib/codemirror"));
	else if (typeof define == "function" && define.amd) // AMD
		define(["../../lib/codemirror"], mod);
	else // Plain browser env
		mod(CodeMirror);
})(function(CodeMirror) {

	/**
	 * Permet de marquer une ligne de code.
	 *
	 * @param number lineNumber
	 * 	Numéro de la ligne à marquer.
	 */
	var mark = function(lineNumber) {
		this.__markedsLines().push(this.getLineHandle(lineNumber));
		this.setGutterMarker(lineNumber, "breakpoints", makeMarker());
		this.addLineClass(lineNumber, "background", "CodeMirror-marked");
	};

	/**
	 * Permet de démarquer une ligne de code.
	 *
	 * @param number lineNumber
	 * 	Numéro de la ligne à démarquer.
	 */
	var unmark = function(lineNumber) {
		for(var i = 0; i < this.__markedsLines().length; ++i) {
			if(this.getLineNumber(this.__markedsLines(i)) == lineNumber) {
				this.__markedsLines().splice(i, 1);
				this.setGutterMarker(lineNumber, "breakpoints", null);
				this.removeLineClass(lineNumber, "background", "CodeMirror-marked");
			}
		}
	};

	/**
   * Retourne un tableau de lineHandle vers les lignes marquées.
	 *
	 * @return Array un tableau de lineHandle vers les lignes marquées.
	 */
	var markedsLines = function() {
		return this.__markedsLines().slice();
	}

	/**
   * Retourne un tableau de lineHandle vers les lignes marquées. (private)
	 *
	 * @return Array un tableau de lineHandle vers les lignes marquées.
	 */
	var __markedsLines = function(i) {
		if(this.$$markedsLines == null || this.$$markedsLines == undefined) {
			this.$$markedsLines = [];
		}

		if(i == undefined || i == null) {
			return this.$$markedsLines;
		}
		else {
			return this.$$markedsLines[i];
		}
	}

	/**
	 *	Définition des méthodes ajoutées par l'extension.
	 */
	CodeMirror.defineDocExtension("markLine", mark);
	CodeMirror.defineDocExtension("unmarkLine", unmark);
	CodeMirror.defineDocExtension("markedsLines", markedsLines);
	CodeMirror.defineDocExtension("__markedsLines", __markedsLines);

	/**
	* Créé un marqueur.
	*/
	var makeMarker = function() {
	  var marker = document.createElement("div");
	  marker.innerHTML = "&nbsp;";
	  marker.className = "breakpoint fa fa-arrow-circle-o-right breakpoint-marker";
	  return marker;
	}

});

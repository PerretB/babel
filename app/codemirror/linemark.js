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
		this.lineMarkMod.markedsLines.push(this.getLineHandle(lineNumber));
		CodeMirror.signal(this, "mark", this, lineNumber);
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
				CodeMirror.signal(this, "unmark", this, lineNumber);
			}
		}
	};

	/**
   * Retourne un tableau de lineHandle vers les lignes marquées.
	 *
	 * @return Array un tableau de lineHandle vers les lignes marquées.
	 */
	var markedsLines = function() {
		return this.lineMarkMod.markedsLines.slice();
	}

	/**
   * Retourne un tableau de lineHandle vers les lignes marquées. (private)
	 *
	 * @return Array un tableau de lineHandle vers les lignes marquées.
	 */
	var __markedsLines = function(i) {
		if(i == undefined || i == null) {
			return this.lineMarkMod.markedsLines;
		}
		else {
			return this.lineMarkMod.markedsLines[i];
		}
	}

	/**
	 *	Définition des méthodes ajoutées par l'extension.
	 */
	CodeMirror.defineExtension("markLine", mark);
	CodeMirror.defineExtension("unmarkLine", unmark);
	CodeMirror.defineExtension("markedsLines", markedsLines);
	CodeMirror.defineExtension("__markedsLines", __markedsLines);

	/**
	* Appellée à chaque marquage de ligne.
	*/
	var onMark = function(CodeMirror, lineNumber) {
		CodeMirror.setGutterMarker(lineNumber, "breakpoints", makeMarker());
		CodeMirror.addLineClass(lineNumber, "background", "CodeMirror-marked");
	};

	/**
	* Appellée à chaque démarquage de ligne.
	*/
	var onUnmark = function(CodeMirror, lineNumber) {
		CodeMirror.setGutterMarker(lineNumber, "breakpoints", null);
		CodeMirror.removeLineClass(lineNumber, "background", "CodeMirror-marked");
	};

	/**
	* Créé un marqueur.
	*/
	var makeMarker = function() {
	  var marker = document.createElement("div");
	  marker.innerHTML = "&nbsp;";
	  marker.className = "breakpoint fa fa-arrow-circle-o-right breakpoint-marker";
	  return marker;
	}

	/**
	 * Code d'initialisation.
	 */
	CodeMirror.defineInitHook(function(CodeMirror) {

		CodeMirror.on("mark", onMark);
		CodeMirror.on("unmark", onUnmark);

		CodeMirror.lineMarkMod = {
			markedsLines:[]
		};

	});
});

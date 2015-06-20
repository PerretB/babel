/**
 * Addon CodeMirror pour bloquer des lignes dans l'ide.
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
	 * Permet de bloquer une ligne de code.
	 *
	 * @param number lineNumber
	 * 	Numéro de la ligne à bloquer.
	 */
	var lock = function(lineNumber) {
		if(!this.isLockedLine(lineNumber)) {
			this.__lockedsLines().push(this.getLineHandle(lineNumber));
			this.addLineClass(lineNumber, "background", "CodeMirror-locked");
			this.addLineClass(lineNumber, "background", "fa");
			this.addLineClass(lineNumber, "background", "fa-lock");
			checkCursor(this);
		}
	};

	/**
	 * Permet de débloquer une ligne de code.
	 *
	 * @param number lineNumber
	 * 	Numéro de la ligne à débloquer.
	 */
	var unlock = function(lineNumber) {
		for(var i = 0; i < this.__lockedsLines().length; ++i) {
			if(this.getLineNumber(this.__lockedsLines(i)) == lineNumber) {
				this.__lockedsLines().splice(i, 1);
				this.removeLineClass(lineNumber, "background", "CodeMirror-locked");
			}
		}
	};

	/**
	 * Vérifie qu'une ligne est bloquée ou non.
	 *
	 * @param number lineNumber
	 * 	Numéro de la ligne à tester.
	 */
	var isLockedLine = function(lineNumber) {
		for(var i = 0; i < this.__lockedsLines().length; ++i) {
			if(this.getLineNumber(this.__lockedsLines(i)) == lineNumber) {
				return true;
			}
		}
		return false;
	};

	/**
	* Vérifie que la sélection ne contient pas de ligne bloquées.
	*
	* @param object from curseur de départ
	* @param object to curseur de fin
	*
	* @return boolean true si la sélection contient une ligne bloquée.
	*/
	var containsLockedLines = function(from, to) {
		for(var line = from.line; line <= to.line; ++line) {
				if(this.isLockedLine(line)) {
					return true;
				}
		}
		return false;
	};

	/**
   * Retourne un tableau de lineHandle vers les lignes lockées.
	 *
	 * @return Array un tableau de lineHandle vers les lignes lockées.
	 */
	var lockedsLines = function() {
		return this.__lockedsLines().slice();
	}

	/**
   * Retourne un tableau de lineHandle vers les lignes lockées. (private)
	 *
	 * @return Array un tableau de lineHandle vers les lignes lockées.
	 */
	var __lockedsLines = function(i) {
		if(this.$$lockedsLines == undefined || this.$$lockedsLines == null) {
			this.$$lockedsLines = [];
		}

		if(i == undefined || i == null) {
			return this.$$lockedsLines;
		}
		else {
			return this.$$lockedsLines[i];
		}
	}

	/**
	 *	Définition des méthodes ajoutées par l'extension.
	 */
	CodeMirror.defineDocExtension("lockLine", lock);
	CodeMirror.defineDocExtension("unlockLine", unlock);
	CodeMirror.defineDocExtension("isLockedLine", isLockedLine);
	CodeMirror.defineDocExtension("containsLockedLines", containsLockedLines);
	CodeMirror.defineDocExtension("lockedsLines", lockedsLines);
	CodeMirror.defineDocExtension("__lockedsLines", __lockedsLines);

	/**
	* Retourne la direction du curseur en fonction de deux positions.
	*
	* @param object lastCursorPosition dernière position connue.
	* @param object newCursorPosition nouvelle position.
	*
	* @return number 1 ou -1 en fonction du déplacement.
	*/
	var getCursorDirection = function(lastCursorPosition, newCursorPosition) {

		if(
			lastCursorPosition == undefined || lastCursorPosition == null ||
			newCursorPosition == undefined || newCursorPosition == null
		)
		{
				return 1;
		}

		if(newCursorPosition.line - lastCursorPosition.line < 0) {
				return -1;
		}
		else {
				return 1;
		}
	};

	/**
	* Insère une nouvelle ligne au début du document.
	*/
	var insertNewLineFirst = function(CMDocument) {
		CMDocument.replaceRange("\n", {line:0, ch:0}, undefined, "LockMod");
	};

	/**
	* Insère une nouvelle ligne à la fin du document.
	*/
	var insertNewLineEnd = function(CMDocument) {
		var lastLine = CMDocument.lastLine();
		CMDocument.replaceRange("\n", {line:lastLine, ch:CMDocument.getLine(lastLine).length}, undefined, "LockMod");
	};

	/**
	* Change la position du curseur vers une position valide.
	*/
	var updateCursorPosition = function(CMDocument, cursorDirection) {

		var actualLine = CMDocument.getCursor().line;

		while(CMDocument.isLockedLine(actualLine)) {

			actualLine += cursorDirection;

			if(actualLine < 0) {
				actualLine = 0;
				insertNewLineFirst(CMDocument);
			}

			if(actualLine > CMDocument.lastLine()) {
				insertNewLineEnd(CMDocument);
			}

		}

		CMDocument.setCursor({line:actualLine, ch:0});

	};

  /**
	* Vérifie que le curseur n'est pas sur une position hasardeuse.
	*/
	var checkCursor = function(CMDocument) {

		var lastCursorPosition = CMDocument.lastCursorPosition;
		var newCursorPosition = CMDocument.getCursor();

		// On authorise la sélection.
		if(!CMDocument.somethingSelected()) {
			if(CMDocument.isLockedLine(newCursorPosition.line)) {
				var cursorDirection = getCursorDirection(lastCursorPosition, newCursorPosition);
				updateCursorPosition(CMDocument, cursorDirection);
			}
		}

		CMDocument.lastCursorPosition = CMDocument.getCursor();
	};

	var checkDocCursor = function(CodeMirror) {
		checkCursor(CodeMirror.getDoc());
	};

	/**
	* Vérifie que les modifications sont valides.
	*/
	var checkChange = function(CodeMirror, updates) {
		if(updates.origin != "LockMod" && CodeMirror.getDoc().containsLockedLines(updates.from, updates.to)) {
			updates.cancel();
		}
	};

	/**
	 * Enregistrement des différents écouteurs permettant de maintenir
	 * la cohérence des lignes bloquées en fonction des changements de
	 * l'utilisateur.
	 *
	 * Et code d'initialisation.
	 */
	CodeMirror.defineInitHook(function(CodeMirror) {

		CodeMirror.on("cursorActivity", checkDocCursor);
		CodeMirror.on("beforeChange", checkChange);

	});

});

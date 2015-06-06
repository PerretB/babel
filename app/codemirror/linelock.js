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
			this.lineLockMod.lockedsLines.push(this.getLineHandle(lineNumber));
			CodeMirror.signal(this, "lock", this, lineNumber);
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
				CodeMirror.signal(this, "unlock", this, lineNumber);
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
		return this.lineLockMod.lockedsLines.slice();
	}

	/**
   * Retourne un tableau de lineHandle vers les lignes lockées. (private)
	 *
	 * @return Array un tableau de lineHandle vers les lignes lockées.
	 */
	var __lockedsLines = function(i) {
		if(i == undefined || i == null) {
			return this.lineLockMod.lockedsLines;
		}
		else {
			return this.lineLockMod.lockedsLines[i];
		}
	}

	/**
	 *	Définition des méthodes ajoutées par l'extension.
	 */
	CodeMirror.defineExtension("lockLine", lock);
	CodeMirror.defineExtension("unlockLine", unlock);
	CodeMirror.defineExtension("isLockedLine", isLockedLine);
	CodeMirror.defineExtension("containsLockedLines", containsLockedLines);
	CodeMirror.defineExtension("lockedsLines", lockedsLines);
	CodeMirror.defineExtension("__lockedsLines", __lockedsLines);

	/**
	* Retourne la direction du curseur en fonction de deux positions.
	*
	* @param object lastCursorPosition dernière position connue.
	* @param object newCursorPosition nouvelle position.
	*
	* @return number 1 ou -1 en fonction du déplacement.
	*/
	var getCursorDirection = function(lastCursorPosition, newCursorPosition) {
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
	var insertNewLineFirst = function(CodeMirror) {
		CodeMirror.replaceRange("\n", {line:0, ch:0}, undefined, "LockMod");
	};

	/**
	* Insère une nouvelle ligne à la fin du document.
	*/
	var insertNewLineEnd = function(CodeMirror) {
		var lastLine = CodeMirror.lastLine();
		CodeMirror.replaceRange("\n", {line:lastLine, ch:CodeMirror.getLine(lastLine).length}, undefined, "LockMod");
	};

	/**
	* Appellée à chaque verrouillage de ligne.
	*/
	var onLock = function(CodeMirror, lineNumber) {
		CodeMirror.addLineClass(lineNumber, "background", "CodeMirror-locked");
		checkCursor(CodeMirror);
	};

	/**
	* Appellée à chaque déverrouillage de ligne.
	*/
	var onUnlock = function(CodeMirror, lineNumber) {
		CodeMirror.removeLineClass(lineNumber, "background", "CodeMirror-locked");
	};

	/**
	* Change la position du curseur vers une position valide.
	*/
	var updateCursorPosition = function(CodeMirror, cursorDirection) {

		var actualLine = CodeMirror.getCursor().line;

		while(CodeMirror.isLockedLine(actualLine)) {

			actualLine += cursorDirection;

			if(actualLine < 0) {
				actualLine = 0;
				insertNewLineFirst(CodeMirror);
			}

			if(actualLine > CodeMirror.lastLine()) {
				insertNewLineEnd(CodeMirror);
			}

		}

		CodeMirror.setCursor({line:actualLine, ch:0});

	};

  /**
	* Vérifie que le curseur n'est pas sur une position hasardeuse.
	*/
	var checkCursor = function(CodeMirror) {

		var lastCursorPosition = CodeMirror.lineLockMod.lastCursorPosition;
		var newCursorPosition = CodeMirror.getCursor();

		// On authorise la sélection.
		if(!CodeMirror.somethingSelected()) {
			if(CodeMirror.isLockedLine(newCursorPosition.line)) {
				var cursorDirection = getCursorDirection(lastCursorPosition, newCursorPosition);
				updateCursorPosition(CodeMirror, cursorDirection);
			}
		}

		CodeMirror.lineLockMod.lastCursorPosition = CodeMirror.getCursor();
	};

	/**
	* Vérifie que les modifications sont valides.
	*/
	var checkChange = function(CodeMirror, updates) {
		if(updates.origin != "LockMod" && CodeMirror.containsLockedLines(updates.from, updates.to)) {
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

		CodeMirror.on("lock", onLock);
		CodeMirror.on("unlock", onUnlock);

		CodeMirror.on("cursorActivity", checkCursor);
		CodeMirror.on("beforeChange", checkChange);

		CodeMirror.lineLockMod = {
			lockedsLines:[],
			lastCursorPosition:{line:0, ch:0}
		};

	});

});

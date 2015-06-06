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
		CodeMirror.replaceRange("\n", {line:0, ch:0});
	};

	/**
	* Insère une nouvelle ligne à la fin du document.
	*/
	var insertNewLineEnd = function(CodeMirror) {
		var lastLine = CodeMirror.lastLine();
		CodeMirror.replaceRange("\n", {line:lastLine, ch:CodeMirror.getLine(lastLine).length});
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
	* Tente de supprimer le maximum de contenu sur une ligne fixe.
	*/
	var tryToRemoveInLine = function(CodeMirror, from, lastCh) {
		if(!CodeMirror.isLockedLine(from.line)) {

			if(lastCh != null && lastCh != undefined) {
				lastCh = {line:from.line, ch:lastCh};
			}

			CodeMirror.replaceRange("", from, lastCh);

		}
	};

	/**
	*	Tente de supprimer le maximum de contenu possible dans une zone donnée.
	*/
	var tryToRemove = function(CodeMirror, from, to) {

		if(from.line == to.line) {
			tryToRemoveInLine(CodeMirror, from, to.ch);
		}
		else {
			tryToRemoveInLine(CodeMirror, from);
			for(var line = updates.from.line+1; line < updates.to.line; ++line) {
				tryToRemoveInLine(CodeMirror, {line:line, ch:0});
			}
			tryToRemoveInLine(CodeMirror, {line:to.line, ch:0}, to.ch);
		}

	};

	/**
	* Vérifie que les modifications sont valides.
	*/
	var checkChange = function(CodeMirror, updates) {
		console.log(updates);
		if(updates.origin == "+delete") {
			updates.cancel();
			tryToRemove(updates.from, updates.to);
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

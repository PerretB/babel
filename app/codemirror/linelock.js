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
		if(!this.isLocked(lineNumber)) {
			this.lockedsLines[lineNumber] = true;
			this.CodeMirror.signal({}, "lock", lineNumber);
		}
	};
	
	/**
	 * Permet de débloquer une ligne de code.
	 * 
	 * @param number lineNumber
	 * 	Numéro de la ligne à débloquer.
	 */
	var unlock = function(lineNumber) {
		if(this.isLocked(lineNumber)) {
			delete this.lockedsLines[lineNumber];
			this.CodeMirror.signal({}, "unlock", lineNumber);
		}
	};
	
	/**
	 * Vérifie qu'une ligne est bloquée ou non.
	 * 
	 * @param number lineNumber
	 * 	Numéro de la ligne à tester.
	 */
	var isLocked = function(lineNumber) {
		if(this.lockedsLines[lineNumber]) {
			return true;
		}
		else {
			return false;
		}
	};
	
	/**
	 * Création de l'extension à ajouter à l'instance de l'ide, pour
	 * accéder à un élément : CodeMirror.lock.function();
	 */
	CodeMirror.defineExtension("lock", {
		lockedsLines:{},
		lock:lock,
		unlock:unlock,
		isLocked:isLocked,
		CodeMirror:null
	});
	
	var onLock = function(CodeMirror, lineNumber) {
		CodeMirror.addLineClass(lineNumber, "background", "codemirror-locked");
	};
	
	var onUnlock = function(CodeMirror, lineNumber) {
		CodeMirror.removeLineClass(lineNumber, "background", "codemirror-locked");
	};
	
	/**
	 * Enregistrement des différents écouteurs permettant de maintenir
	 * la cohérence des lignes bloquées en fonction des changements de
	 * l'utilisateur.
	 */
	CodeMirror.defineInitHook(function(CodeMirror) {
		CodeMirror.lock.CodeMirror = CodeMirror;
		
		CodeMirror.on("lock", onLock);
		
		CodeMirror.on("unlock", onUnlock);
		
	});
	
});

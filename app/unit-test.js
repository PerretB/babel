// Vérifie les contraintes sur le code
function checkCodeConstraints() {
	var code = getCode();
	// Vérifie la syntaxe
	try {
		myInterpreter = new Interpreter(code, initInterpreter);
		var numberOfErrors = 0;

		// Vérifie s'il existe une définition de fonction
		var sortFunctionBody = myInterpreter.ast.body[0].body;
		if (containsAType(sortFunctionBody, 'FunctionDeclaration')) {
			showError("Le code ne doit pas contenir de <strong>sous-fonction</strong>.");
			numberOfErrors++;
		}
		// Vérifie s'il existe un return
		if (!containsAType(sortFunctionBody, 'ReturnStatement')) {
			showError("Le code doit contenir un <strong>return</strong>.");
			numberOfErrors++;
		}

		// Vérifie si la fonction sort est appelée
		if (!containsFunctionCall(sortFunctionBody, 'sort')) {
			showError("Le code ne doit pas faire appel à la méthode <strong>sort</strong>.");
			numberOfErrors++;
		}

		// Lance et vérifie les tests unitaires
		if (numberOfErrors === 0) {
			runProgramWithUnitTests();
		}

	}
	catch (err) {
		showError("La compilation a échouée : erreur de <strong>syntaxe</strong>.");
		showError(err);
	}
}

// Exécute tout le code étape par étape
function runProgramWithUnitTests() {
	goToTheNextStep();
}

// Va d'étapes en étapes tant que la pause n'est pas requise.
// La demande d'une pause est effectuée par l'interpréteur lorsqu'il rencontre un test unitaire (voir plus bas)
function goToTheNextStep() {
	try {
		var nextStep = myInterpreter.step();
	} finally {
		if (!nextStep) {
			showSuccess("Le programme semble correct ! Il passe les tests unitaires.");
			return false;
		}
	}

	if (pauseRequested) {
		pauseRequested = false;
	} else {
		goToTheNextStep();
	}
}

// L'interpréteur a rencontré un test unitaire et demande une pause de l'éxécution du code le temps de vérifier une variable en particulier
function checkUnitTestVariable(variableName, variableValue) {
	pauseRequested = true;

	// Tester la variable donnée en paramètre
	var successfulTest = false;
	if (variableName === 't1') {
		var good_t1 = [1, 3, 5];
		var given_t1 = interpreterObjectToArray(variableValue);
		successfulTest = areEquals(good_t1, given_t1);
	}
	else if (variableName === 't2') {
		var good_t2 = [-5, -2, 0, 2];
		var given_t2 = interpreterObjectToArray(variableValue);
		successfulTest = areEquals(good_t2, given_t2);
	}

	if (successfulTest) {
		goToTheNextStep();
	}
	else {
		showError("Le programme est incorrect. Il ne passe pas les tests unitaires.");
	}
}

// Convertit un objet de l'interpréteur en array
function interpreterObjectToArray(object) {
	var array = [];
	for (var key in object.properties) {
		array.push(object.properties[key].data);
	}
	return array;
}

// Permet à l'interpréteur de pouvoir appeler la fonction checkUnitTestVariable à l'interpréteur
function initInterpreter(interpreter, scope) {
	var wrapper = function(variableName, variableValue) {
		variableName = variableName ? variableName.toString() : '';
		return interpreter.createPrimitive(checkUnitTestVariable(variableName, variableValue));
	};
	interpreter.setProperty(scope, 'checkUnitTestVariable',
		interpreter.createNativeFunction(wrapper));
}

// Récupère les tests unitaires à effectuer au format texte
function getUnitTest() {
	unitTests = '';
	unitTests += 'var t1 = [1, 5, 3];\n';
	unitTests += 'var t2 = [2, -5, -2, 0];\n';
	unitTests += 'var t1_trie = trier(t1);\n';
	unitTests += "checkUnitTestVariable('t1', t1_trie);\n";
	unitTests += 'var t2_trie = trier(t2);\n';
	unitTests += "checkUnitTestVariable('t2', t2_trie);\n";
	return unitTests;
}

// Teste si deux arrays sont égaux
function areEquals(a, b) {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length != b.length) return false;

	for (var i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

// Teste si un noeud de l'interpréteur (ou l'un de ses fils) est d'un certain type (ex : fonction, return statement, etc.)
function containsAType(node, type) {
	if (Array.isArray(node.body)) {
		booleanTTT = false;
		for (i=0; i<node.body.length; ++i) {
			booleanTTT = booleanTTT || containsAType(node.body[i], type);
		}
		return booleanTTT;
	}

	if (node.type == type) {
		return true;
	}

	if (node.body === undefined) {
		return false;
	}

	return containsAType(node.body, type);
}

// Teste si un noeud de l'interpréteur (ou l'un de ses fils) est un appel à la fonction dont le nom est passé en paramètre
function containsFunctionCall(node, functionName) {

	if (Array.isArray(node.body)) {
		booleanTTT = false;
		for (i=0; i<node.body.length; ++i) {
			booleanTTT = booleanTTT || containsFunctionCall(node.body[i], functionName);
		}
		return booleanTTT;
	}

	if (node.body === undefined) {
		if (node.type == 'ExpressionStatement') {
			if (node.expression.type == "CallExpression") {
				if (node.expression.callee.name == functionName)
					return true;
			}
		}
		return false;
	}

	return containsFunctionCall(node.body, functionName);
}

// Affiche un message d'information
function print(message) {
	showMessage('info', message);
}

// Affiche un message de confirmation/succès
function showSuccess(message) {
	showMessage('success', message);
}

// Affiche un message d'erreur
function showError(message) {
	showMessage('danger', message);
}

// Affiche un message du type spécifié
function showMessage(type, message) {
	var errorDiv = document.createElement('div');
	errorDiv.setAttribute("class", "alert alert-" + type);
	errorDiv.setAttribute("role", "alert");
	errorDiv.innerHTML = message;
	document.getElementById('messages').appendChild(errorDiv);
}

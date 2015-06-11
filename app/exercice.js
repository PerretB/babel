(function() {

	var dependencies = [
		"babel.editor",
		"babel.cmd",
		"babel.script",
		"babel.errors"
	];

	var module = angular.module("babel.exercice", dependencies);

	module.directive("exercice", [
		"$scripts",
		"$editors",
		function($scripts, $editors) {
			return {
				"restrict":"E",
				"scope":{
					"category":"@",
					"title":"@"
				},
				"templateUrl":"templates/exercice.html",
				"link": {
					pre: function(scope, iElem, iAttrs) {
						scope.$editor = $editors.$new();
					},

					post: function(scope, iElem, iAttrs) {

						var test =
									 'root ' +
								   '. function sort [error:"Il n\'y a pas de fonction sort."   ] [nammed:premiereErreur] ' +
								   'with { return } [error:"La fonction sort ne retourne rien."] [nammed:secondeErreur ]';

						scope.$cmdContent = "";
						scope.$script = null;
						scope.$errors = [];

						scope.$watch('$code', function() {
							scope.$script = null;
						});

						scope.$compile = function() {
							scope.$script = $scripts.$build(scope.$code);
                            errors = scope.$script.$test(test);
                            msgs = [];

                            errors.each(function() {
                               msgs.push(this.error);
                            });

                            scope.$errors = msgs;

                            if(scope.$errors.length > 0) {
                                scope.$script = null;
                            }
						};

						scope.$execute = function() {
							scope.$script.$run();
							scope.$cmdContent = scope.$script.$cmd();
							scope.$script = null;
						};

						/* dernier noeud parcouru */
						scope.$previousNode = null;
						/* dernier noeud surlequel le script s'est arrêté */
						scope.$previousNodePausedOn = null;
						/* dernière ligne marquée en tant que prochaine instruction à exécuter */
						scope.$lastMarkedLine = null;

						/**
						 * Retourne la liste des types de noeud surlesquels une pause s'avère intéressante (step-by-step 'instruction-by-instruction').
						 *
						 * @return la liste des types de noeud surlesquels une pause s'avère intéressante. Les données de la liste peuvent être au format suivant :
						 * 'XXXX' 						=> Pause on the node if (node.type == XXXX)
						 * 'XXXX preceded by YYYY' 		=> Pause on the node if (node.type == XXXX) and (previousNode == YYYY)
						 * 'XXXX not preceded by YYYY' 	=> Pause on the node if (node.type == XXXX) and (previousNode != YYYY)
						 *
						 * NB: a 'not preceded by' must also be defined alone to work properly. fi : 'ExpressionStatement'
						 */
						scope.$interestingNodeTypes = function() {
							return [
								'ExpressionStatement',
								'VariableDeclaration',
								'ReturnStatement',

								'UpdateExpression preceded by ForStatement',			// Ajoute une pause lors de l'update de la variable de boucle
								'BinaryExpression preceded by ForStatement',			// Ajoute une pause lors du check de la condition de boucle
								'BinaryExpression preceded by WhileStatement',			// Ajoute une pause lors du check de la condition de boucle

								'ExpressionStatement not preceded by CallExpression'	// Empêche une pause sur la fonction appelant une autre lorsque cette dernière a retournée une valeur
							];
						};

						/**
						 * Dit si un step-by-step doit être mis en pause suite à l'arrivée sur un noeud.
						 *
						 * @param stepByStepType
						 *        le type de stepByStep ('detailed-step-by-step', 'instruction-by-instruction')
						 * @param node
						 *        un noeud
						 * @return true si le step-by-step doit être mis en pause.
						 */
						scope.$nodeRequiringAPause = function(stepByStepType, node) {
							if (stepByStepType === 'instruction-by-instruction') {
								var interestingNodeTypes = scope.$interestingNodeTypes();

								var checkPrecededBy		= scope.$previousNode != null && interestingNodeTypes.indexOf(node.type + " preceded by " + scope.$previousNode.type) != -1;
								var checkNotPrecededBy	= scope.$previousNode == null || interestingNodeTypes.indexOf(node.type + " not preceded by " + scope.$previousNode.type) == -1;
								var checkInList			= interestingNodeTypes.indexOf(node.type) != -1 && checkNotPrecededBy;
								var checkDifferentNode 	= node != scope.$previousNodePausedOn;

								var requiresAPause 		= (checkInList && checkDifferentNode) || checkPrecededBy;

								if (requiresAPause) {
									scope.$previousNodePausedOn = node;
									scope.$previousNode = node;
								}
								return requiresAPause;
							}
							// 'detailed-step-by-step'
							return true;
						};

						/**
						 * Marque la ligne correspondant au noeud en tant que prochaine instruction
						 * à exécuter et met en valeur le noeud au sein de cette ligne.
						 */
						scope.$highlightNode = function(node) {
							scope.$editor.$select(
								scope.$editor.$toPosition(node.start),
								scope.$editor.$toPosition(node.end)
							);

							if (scope.$lastMarkedLine != null) {
								scope.$editor.$unmarkLine(scope.$lastMarkedLine);
							}

							scope.$lastMarkedLine = scope.$editor.$toPosition(node.start).line;
							scope.$editor.$markLine(scope.$lastMarkedLine);
						};

						/**
						 * Démarque la ligne correspondant au noeud en tant que prochaine instruction
						 * à exécuter et supprime la mise en valeur du noeud au sein de cette ligne.
						 */
						scope.$unhighlightLastNodeHighlighted = function() {
							if (scope.$lastMarkedLine != null) {
								scope.$editor.$unmarkLine(scope.$lastMarkedLine);
								scope.$editor.$select(scope.$editor.$toPosition(0));
								scope.$lastMarkedLine = null;
								scope.$previousNode = null;
								scope.$previousNodePausedOn = null;
							}
						};

						/**
						 * Va à la prochaine étape d'un step-by-step.
						 *
						 * @param stepByStepType
						 *        le type de stepByStep ('detailed-step-by-step', 'instruction-by-instruction')
						 */
						scope.$next = function(stepByStepType) {
							node = scope.$script.$nextNode();

							if (angular.isDefined(node)) {
								node = node.node;
								// Faire une pause sur le noeud s'il le requiert, sinon aller au prochain
								if (scope.$nodeRequiringAPause(stepByStepType, node)) {
									scope.$highlightNode(node);
								}
								else {
									scope.$previousNode = node;
									if (!scope.$script.$step()) {
										return;
									}
									scope.$next(stepByStepType);
									return;
								}
							}
							// Si c'était la dernière step, enlver les marquages
							else {
								scope.$unhighlightLastNodeHighlighted();
							}

							if(!scope.$script.$step()) {
								scope.$cmdContent = scope.$script.$cmd();
								scope.$script = null;
							}
							else {
								scope.$cmdContent = scope.$script.$cmd();
							}
						};

						scope.$editor.$concat(" ");
						scope.$editor.$concat("function sort (toSort) {");
						scope.$editor.$concat("	var result = [];");
						scope.$editor.$concat("	function test() {};");
						scope.$editor.$concat(" ");
						scope.$editor.$concat("	var a = 0; a++;");
						scope.$editor.$concat("	var c = 4 + a;");
						scope.$editor.$concat("	var b; b = 2; ++b;");
						scope.$editor.$concat("");
						scope.$editor.$concat("	for (var i = 0; i < 2; ++i) {");
						scope.$editor.$concat("		c += i; c += a;");
						scope.$editor.$concat("	}");
						scope.$editor.$concat("");
						scope.$editor.$concat("	while (b > 0) {");
						scope.$editor.$concat("		alert(b);");
						scope.$editor.$concat("		b--;");
						scope.$editor.$concat("	}");
						scope.$editor.$concat("");
						scope.$editor.$concat("	return result;");
						scope.$editor.$concat("}");
						scope.$editor.$concat("var w = sort('x');");
						scope.$editor.$concat("sort('y');");

						scope.$editor.$lockLine(1);
						scope.$editor.$lockLine(19);


					}
				}
			};
		}]);

})();

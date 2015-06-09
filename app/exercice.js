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

						var test = 'root ' +
								   '. function sort with error message "Il n\'y a pas de fonction sort." as premiereErreur ' +
								   '. return with error message "La fonction sort ne retourne rien." as secondeErreur';

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

						scope.$previousNode = null;
						scope.$previousNodePausedOn = null;

						scope.$nodeRequiringAPause = function(node) {
							// 'XXXX' => Pause on the node if (node.type == XXXX)
							// 'YYYY > XXXX' => Pause on the node if (node.type == XXXX) and (previousNode == YYYY)
							// '!YYYY > XXXX' => Pause on the node if (node.type == XXXX) and (previousNode != YYYY)
							var nodeTypesToPauseOn = [
								'ExpressionStatement',
								'VariableDeclaration',
								'ReturnStatement',

								'ForStatement > UpdateExpression',		// Ajoute une pause lors de l'update de la variable de boucle
								'ForStatement > BinaryExpression',		// Ajoute une pause lors du check de la condition de boucle
								'WhileStatement > BinaryExpression',	// Ajoute une pause lors du check de la condition de boucle

								'!CallExpression > ExpressionStatement'	// Empêche une pause sur la fonction appelant une autre lorsque cette dernière a retournée une valeur
							];

							var nodeTypeRequiresAPauseEvenWithPreviousNodeType 	= scope.$previousNode == null || nodeTypesToPauseOn.indexOf("!" + scope.$previousNode.type + " > " + node.type) == -1;
							var nodeDifferentFromLastNodePausedOn 				= node != scope.$previousNodePausedOn;
							var nodeTypeRequiresAPause 							= nodeTypesToPauseOn.indexOf(node.type) != -1 && nodeTypeRequiresAPauseEvenWithPreviousNodeType;
							var nodeTypeRequiresAPauseDueToPreviousNodeType 	= scope.$previousNode != null && nodeTypesToPauseOn.indexOf(scope.$previousNode.type + " > " + node.type) != -1;

							var nodeRequiringAPause 							= (nodeTypeRequiresAPause && nodeDifferentFromLastNodePausedOn) || nodeTypeRequiresAPauseDueToPreviousNodeType;

							if (nodeRequiringAPause) {
								scope.$previousNodePausedOn = node;
								scope.$previousNode = node;
							}
							return nodeRequiringAPause;
						};

						scope.$lastMarkedLine = null;
						// @param type : 'detailed-step-by-step', 'instruction-by-instruction'
						scope.$next = function(type) {
							node = scope.$script.$nextNode();

							if(angular.isDefined(node)) {
								node = node.node;
								//console.log(node);
								
								// Si c'est un noeud surlequel on doit s'arrêter
								if (type == 'detailed-step-by-step' || (type == 'instruction-by-instruction' && scope.$nodeRequiringAPause(node))) {
									scope.$editor.$select(
										scope.$editor.$toPosition(node.start),
										scope.$editor.$toPosition(node.end)
									);

									if (scope.$lastMarkedLine != null) {
										scope.$editor.$unmarkLine(scope.$lastMarkedLine);
									}

									scope.$lastMarkedLine = scope.$editor.$toPosition(node.start).line;
									scope.$editor.$markLine(scope.$lastMarkedLine);

								}
								// Sinon, on va à la prochaine step
								else {
									scope.$previousNode = node;
									if (!scope.$script.$step()) {
										return;
									}
									scope.$next(type);
									return;
								}
							}
							// Si c'était la dernière step, on enlève les marquages
							else {
								scope.$editor.$unmarkLine(scope.$lastMarkedLine);
								scope.$editor.$select(scope.$editor.$toPosition(0));
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

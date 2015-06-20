(function() {

  var dependencies = [
		"babel.editor",
		"babel.execution",
		"babel.cmd",
		"babel.script",
		"babel.errors"
	];

	var module = angular.module("babel.exercice", dependencies);

	module.factory("Exercice", ["Script", "ExecutionSession", function(Script, ExecutionSession) {

		function Exercice() {
			this.constraints  = [];
			this.tests    	  = [];
			this.script       = new Script();
			this.errors				= [];
		}

		Exercice.prototype.unitTest = function(callback) {
				this.unitTests.push(callback);
		};

		Exercice.prototype.constraint = function(query) {
				this.constraints.push(query);
		};

		Exercice.prototype.validate = function() {

			this.errors = [];

			if(!this.script.isValid()) {
				this.errors = ["Il y a des erreurs de syntaxe !"];
				return false;
			}

			angular.forEach(this.constraints, function(constraint) {
				var result = this.script.ast.validate(constraint);

				if(!result.isValid()) {
						result.each(function() {
							this.errors.push(this.error);
						});
				}
			});

			if(this.errors.length > 0) {
				return false;
			}

			angular.forEach(this.tests, function(unitTest) {
				if(!unitTest.apply(this)) {
					return false;
				}
			});

			return true;

		};

		Exercice.prototype.init = function() {
			this.script = new Script(this.initialCode);
		};

		return Exercice;

	}]);

  module.directive("exercice", [
		"Script",
		"Exercice",
		function(Script, Exercice) {
			return {
				"restrict":"E",
				"scope":{
					"category":"@",
					"title":"@"
				},
				"templateUrl":"templates/exercice.html",
				"link": function(scope, iElem, iAttrs) {

					scope.exercice = new Exercice();
					scope.exercice.script = new Script(
						"function sort(array) {\n\n}\n\nfor(var i = 0; i < 10; ++i) {\n  print(i);\n}",
						"javascript"
					);

					scope.exercice.script.lockLine(0);
					scope.exercice.script.lockLine(2);

					scope.exercice.constraint('root . function sort [error:"Il n\'y a pas de fonction sort."] [named:premiereErreur] with { root . return } [error:"La fonction sort ne retourne rien."] [named:secondeErreur ]');

          scope.$$exec = undefined;

          scope.$syntaxError = function() {
            return !scope.exercice.script.isValid();
          };

          scope.$watch(function() {
            return scope.exercice.script.content()
          }, function() {
            scope.$$exec = undefined;
          })

          scope.$startStepByStep = function() {
            if(scope.exercice.script.isValid()) {
							scope.$$exec = scope.exercice.script.createExecutionSession();
						}
          };

          scope.$endStepByStep = function() {
            scope.$$exec = undefined;
          };

					scope.$execute = function() {
						if(scope.exercice.script.isValid()) {
							exec = scope.exercice.script.createExecutionSession();
							exec.run();
							scope.$$cmdContent = exec.out();
						}
					};

          /* dernier noeud parcouru */
          scope.$previousNode = null;
          /* dernier noeud surlequel le script s'est arrêté */
          scope.$previousNodePausedOn = null;
          /* dernière ligne marquée en tant que prochaine instruction à exécuter */
          scope.$lastMarkedLine = null;
          /* dernier blocStatement rencontré */
          scope.$lastBlockEncountered = null;
          /* bloc dont on souhaite aller à la fin */
          scope.$blockToGoToTheEnd = null;
          /* dernier bloc dont on est allé à la fin */
          scope.$lastBlockGottenToTheEnd = null;

          /**
           * Retourne la liste des types de noeud surlesquels une pause s'avère intéressante (step-by-step 'instruction-by-instruction').
           *
           * @return la liste des types de noeud surlesquels une pause s'avère intéressante. Les données de la liste peuvent être au format suivant :
           * 'XXXX'                       => Pause on the node if (node.type == XXXX)
           * 'XXXX preceded by YYYY'      => Pause on the node if (node.type == XXXX) and (previousNode == YYYY)
           * 'XXXX not preceded by YYYY'  => Pause on the node if (node.type == XXXX) and (previousNode != YYYY)
           *
           * NB: a 'not preceded by' must also be defined alone to work properly. fi : 'ExpressionStatement'
           */
          scope.$interestingNodeTypes = function() {
              return [
                  'ExpressionStatement',
                  'VariableDeclaration',
                  'ReturnStatement',

                  'UpdateExpression preceded by ForStatement',            // Ajoute une pause lors de l'update de la variable de boucle
                  'BinaryExpression preceded by ForStatement',            // Ajoute une pause lors du check de la condition de boucle
                  'BinaryExpression preceded by WhileStatement',          // Ajoute une pause lors du check de la condition de boucle

                  'ExpressionStatement not preceded by CallExpression'    // Empêche une pause sur la fonction appelant une autre lorsque cette dernière a retournée une valeur
              ];
          };

          /**
           * Dit si un step-by-step doit être mis en pause suite à l'arrivée sur un noeud.
           *
           * @param stepByStepType
           *        le type de stepByStep ('detailed-step-by-step', 'instruction-by-instruction', 'get-out-of-block')
           * @param node
           *        un noeud
           * @return true si le step-by-step doit être mis en pause.
           */
          scope.$nodeRequiringAPause = function(stepByStepType, node) {
              if (stepByStepType === 'instruction-by-instruction') {
                  var interestingNodeTypes = scope.$interestingNodeTypes();

                  var checkPrecededBy     = scope.$previousNode != null && interestingNodeTypes.indexOf(node.type + " preceded by " + scope.$previousNode.type) != -1;
                  var checkNotPrecededBy  = scope.$previousNode == null || interestingNodeTypes.indexOf(node.type + " not preceded by " + scope.$previousNode.type) == -1;
                  var checkInList         = interestingNodeTypes.indexOf(node.type) != -1 && checkNotPrecededBy;
                  var checkDifferentNode  = node != scope.$previousNodePausedOn;

                  return  (checkInList && checkDifferentNode) || checkPrecededBy;
              }
              if (stepByStepType === 'get-out-of-block') {
                  if (scope.$blockToGoToTheEnd !== null && node === scope.$blockToGoToTheEnd.body[scope.$blockToGoToTheEnd.body.length - 1]) {
                      scope.$lastBlockGottenToTheEnd = scope.$blockToGoToTheEnd;
                      return true;
                  }
                  return false;
              }
              // 'detailed-step-by-step'
              return true;
          };

          /**
           * Marque la ligne correspondant au noeud en tant que prochaine instruction
           * à exécuter et met en valeur le noeud au sein de cette ligne.
           */
          scope.$highlightNode = function(node) {
              scope.exercice.script.select(
                  scope.exercice.script.toPosition(node.start),
                  scope.exercice.script.toPosition(node.end)
              );

              if (scope.$lastMarkedLine != null) {
                  scope.exercice.script.unmarkLine(scope.$lastMarkedLine);
              }

              scope.$lastMarkedLine = scope.exercice.script.toPosition(node.start).line;
              scope.exercice.script.markLine(scope.$lastMarkedLine);
          };

          /**
           * Démarque la ligne correspondant au noeud en tant que prochaine instruction
           * à exécuter et supprime la mise en valeur du noeud au sein de cette ligne.
           */
          scope.$unhighlightLastNodeHighlighted = function() {
              if (scope.$lastMarkedLine != null) {
                  scope.exercice.script.unmarkLine(scope.$lastMarkedLine);
                  scope.exercice.script.select(scope.$editor.$toPosition(0));
                  scope.$lastMarkedLine = null;
                  scope.$previousNode = null;
                  scope.$previousNodePausedOn = null;
                  scope.$lastBlockEncountered = null;
                  scope.$blockToGoToTheEnd = null;
                  scope.$lastBlockGottenToTheEnd = null;
              }
          };

          scope.$goToEndOfBlock = function() {
              // Si on est déjà à la fin du bloc en cours
              if (scope.$blockToGoToTheEnd != null && scope.$previousNodePausedOn === scope.$blockToGoToTheEnd.body[scope.$blockToGoToTheEnd.body.length - 1]) {
                  return false;
              }
              // Si on est dans le corps principal du programme
              if (scope.$stack.length === 0) {
                  scope.$blockToGoToTheEnd = null;
              }
              // Si on est dans un autre bloc
              else {
                  scope.$blockToGoToTheEnd = scope.$lastBlockEncountered;
              }
              scope.$next('get-out-of-block');
          };

          /**
           * Va à la prochaine étape d'un step-by-step.
           *
           * @param stepByStepType
           *        le type de stepByStep ('detailed-step-by-step', 'instruction-by-instruction')
           */
          scope.$next = function(stepByStepType) {
              var node = scope.$$exec.nextNode().$$node;

              if (angular.isDefined(Node)) {
                  scope.$stack = scope.$$exec.stack();

                  if (node.type == 'BlockStatement') {
                      scope.$lastBlockEncountered = node;
                  }

                  // Faire une pause sur le noeud s'il le requiert, sinon aller au prochain
                  if (scope.$nodeRequiringAPause(stepByStepType, node)) {
                      scope.$previousNodePausedOn = node;
                      scope.$previousNode = node;
                      scope.$highlightNode(node);

                      /*
                      J'ai perdu la fonction dans le merge

                      var $dump = scope.$script.$getDump();
                      var global = $dump["global"]
                      delete $dump["global"];
                      if (global)
                          scope.$dumpGlobal = $dump;
                      else
                          scope.$dumpLocal = $dump;*/

                  }
                  else {
                      scope.$previousNode = node;
                      if (!scope.$$exec.step()) {
                          return;
                      }
                      scope.$next(stepByStepType);
                      return;
                  }
              }
              else {
                  scope.$unhighlightLastNodeHighlighted();
              }

              if(!scope.$$exec.step()) {
                  scope.$$cmdContent = scope.$$exec.out();
                  scope.$unhighlightLastNodeHighlighted();
                  scope.$$exec = undefined;
              }
              else {
                  scope.$$cmdContent = scope.$$exec.out();
              }
          };

				}
			};
		}]);

})();

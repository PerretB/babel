(function() {

  var dependencies = [
		"babel.editor",
		"babel.execution",
		"babel.cmd",
		"babel.script",
		"babel.errors",
		"babel.stack",
		"babel.dump"
	];

	var module = angular.module("babel.exercice", dependencies);

  module.service("$Generator", function() {

    /**
    * Génère un nombre entier aléatoire.
    *
    * @param Number max (optionel)
    * @param Number min (optionel)
    *
    * @return Number un nombre entier aléatoire.
    */
    this.nextInt = function(max, min) {

      if(!angular.isDefined(max)) {
        return Math.floor(Math.random() * Number.MAX_VALUE);
      }
      else if(!angular.isDefined(min)) {
        return Math.floor(Math.random() * max);
      }
      else {
        return Math.floor(Math.random() * (max - min) + min);
      }

    };

    /**
    * Retourne un paramètre aléatoire.
    *
    * @return Object paramètre choisi.
    */
    this.nextOf = function() {
      if(this.params.length <= 0) {
        return undefined;
      }
      else {
        return this.nextIn(this.params);
      }
    };

    /**
    * Retourne un objet aléatoire contenu dans un tableau.
    *
    * @param Array array tableau contenant les valeurs.
    *
    * @return Object valeur aléatoire du tableau passé en paramètre.
    */
    this.nextIn = function(array) {
      return array[this.nextInt(array.length)];
    };

    /**
    * Génère un tableau de valeurs aléatoires.
    *
    * @param Number size taille du tableau.
    *
    * @param Callback callback fonction de génération.
    *
    * @return Array un tableau de valeurs aléatoires.
    */
    this.generateArray = function(size, callback) {

      var result = new Array();

      for(var i = 0; i < size; ++i) {
        result.push(callback(i));
      }

      return result;

    };

  });

	module.factory("Exercice", ["Script", "ExecutionSession", function(Script, ExecutionSession) {

		function Exercice() {
			this.constraints  = [];
			this.tests    	  = [];
			this.script       = new Script();
			this.errors				= [];
		}

		Exercice.prototype.unitTest = function(callback) {
				this.tests.push(callback);
		};

		Exercice.prototype.constraint = function(query) {
				this.constraints.push(query);
		};

		Exercice.prototype.validate = function() {

			this.errors = [];
      var self = this;

			if(!this.script.isValid()) {
				this.errors = ["Il y a des erreurs de syntaxe : " + this.script.error];
				return false;
			}

			angular.forEach(this.constraints, function(constraint) {
				var result = self.script.ast.validate(constraint);

				if(!result.isValid()) {
						result.each(function() {
							self.errors.push(this.error);
						});
				}
			});

			if(this.errors.length > 0) {
				return false;
			}

			angular.forEach(this.tests, function(unitTest) {
				if(!unitTest.apply(self)) {
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

  /**
  solution :::

  var result = [];
  var j = 0;

  for(var i = 0; i < array.length; ++i) {
    if(result.length == 0) {
      result.push(array[i]);
    }
    else {
      var stop = false;

      for(j = 0; j < result.length && !stop; ++j) {
        if(result[j] > array[i]) {
          var start = result.slice(0, j);
          var end = result.slice(j);
          start.push(array[i]);
          result = start.concat(end);
          stop = true;
        }
      }

      if(j >= result.length) {
        result.push(array[i]);
      }

    }
  }

  print(result);

  return [];

  */

  module.directive("exercice", [
		"Script",
    "$Generator",
		"Exercice",
		function(Script, $Generator, Exercice) {
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
						"function sort(array) {\n\n}",
						"javascript"
					);

					scope.exercice.script.lockLine(0);
					scope.exercice.script.lockLine(2);

          /**
          * Un test unitaire.
          */
          scope.exercice.unitTest(function() {

            var self = this;

            function validate(initial, result) {

              if(result == null || result == undefined || !(result instanceof Array)) {
                self.errors.push("La fonction sort ne retourne pas un tableau.");
                return false;
              }

              if(initial.length == 0) {
                if(result.length == 0) {
                  return true;
                }
                else {
                  self.errors.push("sort(["+initial+"]) retourne [" + result + "] au lieu de [].");
                  return false;
                }
              }

              if(initial.length == 1) {
                if(result.length == 1 && result[0] == initial[0]) {
                  return true;
                }
                else {
                  self.errors.push("sort(["+initial+"]) retourne [" + result + "] au lieu de ["+initial+"].");
                  return false;
                }
              }

              if(initial.length != result.length) {
                self.errors.push("sort(["+initial+"]) retourne [" + result + "] qui n'est pas correctement trié.");
                return false;
              }

              for(var i = 1; i < result.length; ++i) {
                if(result[i-1] > result[i]) {
                  self.errors.push("sort(["+initial+"]) retourne [" + result + "] qui n'est pas correctement trié.");
                  return false;
                }
              }

              return true;

            };

            var exec = this.script.createExecutionSession();
            exec.prepare();

            for(var i = 0; i < 13; ++i) {
              var initial = $Generator.generateArray(i, function() {
                return $Generator.nextInt(100);
              });

              var result = exec.call("sort", initial).returned;

              if(!validate(initial, result)) {
                return false;
              }

            }

            return true;

          });

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
							scope.exercice.stack = [];
							scope.exercice.dumpGlobal = [];
							scope.exercice.dumpLocal = [];
              scope.$$cmdContent = "";
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

          scope.$validate = function() {
            scope.$$cmdContent = "";
            if(scope.exercice.validate()) {
              scope.$$cmdContent = "Le script est valide !";
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
                  scope.exercice.stack = scope.$$exec.stack(scope);

                  if (node.type == 'BlockStatement') {
                      scope.$lastBlockEncountered = node;
                  }

                  // Faire une pause sur le noeud s'il le requiert, sinon aller au prochain
                  if (scope.$nodeRequiringAPause(stepByStepType, node)) {
                      scope.$previousNodePausedOn = node;
                      scope.$previousNode = node;
                      scope.$highlightNode(node);

                      var $dump = scope.$$exec.dump();
                      var global = $dump["global"]
                      delete $dump["global"];
                      if (global)
                          scope.exercice.dumpGlobal = $dump;
                      else
                          scope.exercice.dumpLocal = $dump;

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

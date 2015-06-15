(function() {

  var dependencies = [
    "babel.ast.request.parser"
  ];

  var module = angular.module("babel.ast", dependencies);

  /**
  * Wrapper pour faciliter les opérations sur les noeuds
  * des AST.
  *
  * @param object node Noeud à wrapper.
  * @param Node parent (optionel) noeud parent.
  */
  var Node = function(node, parent) {
    this.$$node = node;
    this.$$parent = parent;
  };

  /**
  * Permet de parcourir tous les fils du noeud.
  *
  * Cette méthode va sélectionne chaque fils du noeud, et appliquer la fonction
  * callback dessus. Pour récupérer le noeud actuel dans la fonction il suffit
  * d'appeller this.
  *
  * Si le callback return false, la recherche est automatiquement stoppée dans
  * la branche actuelle.
  *
  * @param function callback fonction appliquée sur chaque fils.
  * @param Array args paramètres à passer à la fonction.
  */
  Node.prototype.walk = function(callback, args) {

    var continueWalk;

    // Appel du callback sur le noeud en cours
    if(angular.isDefined(args)) {
      continueWalk = callback.apply(this, args);
    }
    else {
      continueWalk = callback.call(this, this);
    }

    // Si pas de body, ou demande d'arrêt retour.
    if (continueWalk === false || !this.hasChilds()) {
      return;
    }
    else {
      var count = this.count();
      for (var i = 0; i < count; ++i) {
        this.child(i).walk(callback, args);
      }
    }

  };

  /**
  * Créée une copie du noeud actuel.
  *
  * @return Node Copie du noeud actuel.
  */
  Node.prototype.copy = function() {
    var cpy = new Node(this.$$node, this.$$parent);
    return cpy;
  };

  /**
  * Test le type du noeud.
  *
  * Cette méthode inclu des comportements complémentaires :
  * - Le test est insensible à la casse.
  * - Permet de tester les classes englobantes comme declaration, function,
  *   etc...
  *
  * @param string label Nom du type espéré.
  *
  * @return boolean true si le noeud est du type désiré.
  */
  Node.prototype.is = function(label) {
    return this.$$node.type.toLowerCase().indexOf(label.toLowerCase()) >= 0;
  };

  /**
  *
  *
  */
  Node.prototype.identifier = function() {
    return this.$$node.id.name;
  };

  /**
  * Vérifie si le noeud possède des enfants.
  *
  * @return boolean true si le noeud possède des enfants.
  */
  Node.prototype.hasChilds = function() {
    return angular.isDefined(this.$$childs());
  };

  /**
  * Retourne la liste des fils du noeud, s'il en a.
  *
  * @return Array la liste des enfants.
  */
  Node.prototype.childs = function() {

    var childs = this.$$childs();
    var nodes = [];

    if (angular.isDefined(childs)) {
      for(var i = 0; i < childs.length; ++i) {
        nodes.push(new Node(childs[i], this));
      }
    }
    else {
      nodes = null;
    }

    return nodes;

  };

  /**
  * Fonction privée qui retourne les enfants non wrappés.
  * @return Array la liste des enfants non wrappés.
  */
  Node.prototype.$$childs = function() {

    var childs;

    if (angular.isDefined(this.$$node.body)) {
      if (Array.isArray(this.$$node.body)) {
        childs = this.$$node.body;
      }
      else {
        childs = this.$$node.body.body;
      }
    }
    else {
      childs = null;
    }

    return childs;

  };

  /**
  * @return Number Le nombre d'enfants.
  */
  Node.prototype.count = function() {

    var childs = this.$$childs();

    if (childs != null && childs != undefined) {
      return childs.length;
    }
    else {
      return 0;
    }

  };

  /**
  * @param Number i index de l'enfant.
  *
  * @return Node l'enfant à l'index choisi.
  */
  Node.prototype.child = function(i) {

    var childs = this.$$childs();

    if(angular.isDefined(childs)) {
      node = new Node(childs[i], this);
      return node;
    }
    else {
      return undefined;
    }

  };

  /**
  * Parcourt les fils et appelle une fonction callback dessus.
  *
  * Pour récupérer l'élément actuel il suffit d'appeller this.
  *
  * @param function callback Fonction à appeller sur chaque fils.
  * @param Array args Arguments à passer à la fonction callback.
  */
  Node.prototype.each = function(callback, args) {

    var run = true;
    var childs = this.childs();

    if(angular.isDefined(childs)) {
      for(var i = 0; i < childs.length && run !== false; ++i) {

        if(angular.isDefined(args)) {
          run = callback.apply(childs[i], args);
        }
        else {
          run = callback.call(childs[i], childs[i]);
        }

      }
    }

  };

  /**
  * Liste les arguments d'une fonction.
  */
  Node.prototype.args = function() {
    var args = new Array();

    for(var i = 0; i < this.$$node.params.length; ++i) {
      args.push(this.$$node.params[i].name);
    }

    return args;
  };

  /**
  * AST
  */
  var AST = function(ast) {
    this.$$node = ast;
  };

  AST.prototype = new Node();

  module.service('$AST', ["$ASTRequestParser", function($ASTRequestParser) {

    AST.prototype.find = function(request) {
      return this.request(request).find(this);
    };

    AST.prototype.validate = function(request) {
      return this.request(request).validate(this);
    };

    AST.prototype.request = function(request) {
      return $ASTRequestParser.$parse(request);
    };

    this.$create = function(ast) {
      return new AST(ast);
    };

    this.$createNode = function(node) {
      return new Node(node);
    };

  }]);


})();

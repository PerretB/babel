var ASTRequest = (function() {

  var __defined = function(element) {
    return element != null && element != undefined;
  };

  var __undefined = function(element) {
    return element == null || element == undefined;
  };

  var __extends = function(child, mother) {
    child.prototype = new mother();
  };

  /**
  * Wrapper pour faciliter le parcourt dans les nodes.
  */
  var Node = function(node) {
    this.node = node;
    this.parent = null;
  };

  Node.prototype.walk = function(callback, args) {

    var continueWalk;

    // Appel du callback sur le noeud en cours
    if(__defined(args)) {
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

  Node.prototype.copy = function() {
    node = new Node(this.node);
    node.parent = this.parent;
    return node;
  };

  Node.prototype.is = function(label) {

    if(label == "function") {
      return this.node.type == "FunctionDeclaration";
    }
    else if(label == "return") {
      return this.node.type == "ReturnStatement";
    }
    else {
      return this.node.type == label;
    }

  };

  Node.prototype.identifier = function() {
    return this.node.id.name;
  };

  /**
  * @return boolean true si le noeud possède des enfants.
  */
  Node.prototype.hasChilds = function() {
    return __defined(this.childs());
  };

  /**
  * @return Array la liste des enfants.
  */
  Node.prototype.childs = function() {
    if (__undefined(this.node.body)) {
      return null;
    }
    else if (Array.isArray(this.node.body)) {
      return this.node.body;
    }
    else {
      return this.node.body.body;
    }
  };

  /**
  * @return Number le nombre d'enfants.
  */
  Node.prototype.count = function() {
    var childs = this.childs();

    if(__defined(childs)) {
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
    var childs = this.childs();

    if(__defined(childs)) {
      node = new Node(childs[i]);
      node.parent = this;
      return node;
    }
    else {
      return undefined;
    }
  };

  Node.prototype.each = function(callback, args) {

    var run = true;
    var childs = this.childs();

    if(__defined(childs)) {
      for(var i = 0; i < childs.length && run !== false; ++i) {

        if(__defined(args)) {
          run = callback.apply(childs[i], args);
        }
        else {
          run = callback.call(childs[i], childs[i]);
        }

      }
    }

  };

  var RequestResult = function(value) {
    if(Array.isArray(value)) {
      this.nodes = value;
    }
    else if(__defined(value)) {
      this.nodes = [value];
    }
    else {
      this.nodes = [];
    }
  };

  RequestResult.prototype.isEmpty = function() {
    return this.nodes.length <= 0;
  };

  RequestResult.prototype.length = function() {
    return this.nodes.length;
  };

  RequestResult.prototype.get = function(i) {
    return this.nodes[i];
  };

  RequestResult.prototype.each = function(callback, args) {

    var run = true;

    for(var i = 0; i < this.nodes.length && run !== false; ++i) {

      if(__defined(args)) {
        run = callback.apply(this.nodes[i], args);
      }
      else {
        run = callback.call(this.nodes[i], this.nodes[i]);
      }

    }

  };

  RequestResult.prototype.add = function(element) {
    if(element instanceof RequestResult) {
      this.nodes = this.nodes.concat(element.nodes);
    }
    else {
      this.nodes.push(element);
    }
  };

  /**
  * Une requête, objet permettant de chercher un élément dans un noeud.
  */
  var Request = function() { };

  Request.prototype.find = function(node) {
    if(node instanceof Node) {
      return this.__find(node);
    }
    else if(node instanceof RequestResult) {

      var result = new RequestResult();
      var self = this;

      node.each(function() {
        result.add(self.__find(this));
      });

      return result;

    }
    else {
      return this.__find(new Node(node));
    }
  };

  /**
  * Tente de trouver quelque chose après un appel à init.
  */
  Request.prototype.__find = function(node) {

    if(__defined(node)) {
      return new RequestResult(node);
    }
    else {
      return new RequestResult();
    }
  };

  /**
  * Concatène le résultat de deux requêtes dans un tableau.
  */
  var ConcatRequest = function(first, second) {
    this.first = first;
    this.second = second;
  };

  __extends(ConcatRequest, Request);

  ConcatRequest.prototype.__find = function(node) {

    var first  = this.first.find(node);
    var second = this.second.find(node);

    return first.add(second);

  };

  /**
  * Vérifie que la requête match des éléments enfants direct.
  */
  var FirstChildRequest = function(selector, request) {
    this.selector = selector;
    this.request = request;
  };

  __extends(FirstChildRequest, Request);

  /**
  * Récupère les enfants du parent.
  */
  FirstChildRequest.prototype.__findChilds = function(node) {

    var result = new RequestResult();
    var self = this;

    node.each(function() {

      result.add(
        self.request.find(this)
      );

    });

    return result;

  };

  FirstChildRequest.prototype.__find = function(node) {

      var parents = this.selector.find(node);
      var result = new RequestResult();
      var self = this;

      parents.each(function() {

        result.add(
          self.__findChilds(this)
        );

      });

      return result;

  };

  /**
  * Vérifie que la requête match des éléments enfants.
  */
  var HasChildRequest = function(selector, request) {
    this.selector = selector;
    this.request = request;
  };

  __extends(HasChildRequest, Request);

  /**
  * Récupère les enfants de tous les parents.
  */
  HasChildRequest.prototype.__findChilds = function(node) {

    var self = this;
    var result = new RequestResult();

    node.walk(function() {
      result.add(
        self.request.find(this)
      );
    });

    return result;

  };


  HasChildRequest.prototype.__find = function(node) {

    var parents = this.selector.find(node);
    var result = new RequestResult();
    var self = this;

    parents.each(function() {
      result.add(
        self.__findChilds(this)
      );
    });

    return result;

  };

  /**
  * Vérifie que la requête match des éléments enfants.
  */
  var NodeTypeRequest = function(type) {
    this.type = type;
  };

  __extends(NodeTypeRequest, Request);

  NodeTypeRequest.prototype.__find = function(node) {

    if(node.is(this.type)) {
      return new RequestResult(node);
    }
    else {
      return new RequestResult();
    }

  };

  /**
  * Vérifie que la requête match une fonction particulière
  */
  var FunctionRequest = function(identifier) {
    this.identifier = identifier;
  };

  __extends(FunctionRequest, Request);

  FunctionRequest.prototype.__find = function(node) {

    if(node.is('function')) {

      console.log(node);

      if(__defined(this.identifier) && node.identifier() != this.identifier) {
        return new RequestResult();
      }

      return new RequestResult(node);

    }

    return new RequestResult();

  };

  var lib = {};

  /**
  * Retourne une requête nulle, celle-ci retournera systématiquement le noeud
  * passé en paramètre.
  */
  lib.rootNode = function() {
    return new Request();
  };

  /**
  * Retourne la requête passée en paramètre.
  */
  lib.identity = function(request) {
    return request;
  };

  /**
  * Créée la concaténation du résultat des deux requêtes.
  */
  lib.concat = function(first, second) {
    return new ConcatRequest(first, second);
  };

  /**
  * Créée une requête sur les premiers enfant d'un ensemble d'éléments.
  */
  lib.firstChild = function(selector, request) {
    return new FirstChildRequest(selector, request);
  };

  /**
  * Créée une requête sur les enfants d'un ensemble d'éléments.
  */
  lib.has = function(selector, request) {
    return new HasChildRequest(selector, request);
  };

  /**
  * Cherche un type de noeud.
  */
  lib.node = function(type) {
    return new NodeTypeRequest(type);
  };

  /**
  * Cherche une fonction particulière.
  */
  lib.functionNode = function(identifier) {
    return new FunctionRequest(identifier);
  };

  /**
  * Assigne un alias à la requête.
  */
  lib.alias = function(request, alias) {
    request.alias = alias;
    return request;
  };

  /**
  * Change le message d'erreur d'une requête.
  */
  lib.defineError = function(request, error) {
    request.error = error;
    console.log(request);
    return request;
  };

  return lib;

})();

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

  var __concat = function(a, b) {
    if(Array.isArray(a) && Array.isArray(b)) {
      return a.concat(b);
    }
    else if(Array.isArray(a) && !Array.isArray(b)) {
      return a.push(b);
    }
    else if(!Array.isArray(a) && Array.isArray(b)) {
      return b.unshift(a);
    }
    else {
      return [a, b];
    }
  };

  /**
  * Wrapper pour faciliter le parcourt dans les nodes.
  */
  var Node = function(node) {
    this.node = node;
    this.parent = null;
    this.__next = 0;
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
      return this.node.type == "Function";
    }
    else if(label == "return") {
      return this.node.type == "ReturnStatement";
    }
    else {
      return this.node.type == label;
    }

  };

  Node.prototype.identifier = function() {
    return this.id;
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
  };

  /**
  * @return boolean true si le noeud contient d'autres enfants.
  */
  Node.prototype.hasNext = function() {
    return this.__next < this.count();
  };

  /**
  * Permet de relancer une itération sur le noeud.
  */
  Node.prototype.reset = function() {
    this.__next = 0;
  };

  /**
  * @return Node l'enfant suivant.
  */
  Node.prototype.next = function() {
    var value = this.child(this.__next);
    this.__next += 1;
    return value;
  };

  /**
  * Erreur lorsqu'une requête ne trouve pas un noeud précis.
  */
  var RequestError = function(message) {
    this.message = message;
  };

  /**
  * Une requête, objet permettant de chercher un élément dans un noeud.
  */
  var Request = function() {
    this.alias = null;
    this.error = "Not found.";
    this.node = null;
  };

  /**
  * Initialise la requête.
  */
  Request.prototype.init = function(node) {

    if(node instanceof Node) {
      this.node = node;
    }
    else {
      this.node = new Node(node);
    }
  };

  /**
  * Tente de trouver quelque chose après un appel à init.
  */
  Request.prototype.find = function() {
    if(__defined(this.node)) {
      return this.node;
    }
    else {
      return new RequestError(this.error);
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

  ConcatRequest.prototype.find = function() {

    this.first.init(this.node.copy());
    var first = this.first.find();

    if(first instanceof RequestError) {
      return first;
    }

    this.second.init(this.node.copy());
    var second = this.second.find();

    if(second instanceof RequestError) {
      return second;
    }
    else {
      return __concat(first, second);
    }

  };

  /**
  * Vérifie que la requête match des éléments enfants direct.
  */
  var FirstChildRequest = function(selector, request) {
    this.selector = selector;
    this.request = request;
    this.__results = null;
    this.__parents = null;
  };

  __extends(FirstChildRequest, Request);

  /**
  * Récupère les enfants d'un parent.
  */
  FirstChildRequest.prototype.__findIn = function(node) {

    if(node.hasChilds()) {

      while(node.hasNext()) {
        var child = node.next();
        this.request.init(child);

        if(!(this.request.find() instanceof RequestError)) {
          this.__results.push(child);
        }
      }

    }

  };

  /**
  * Récupère les enfants de tous les parents.
  */
  FirstChildRequest.prototype.__findChilds = function() {

    if(Array.isArray(this.__parents)) {
      for(var i = 0; i < this.__parents.length; ++i) {
        this.__findIn(this.__parents[i]);
      }
    }
    else {
      this.__findIn(this.__parents);
    }

  };

  FirstChildRequest.prototype.init = function(node) {

    this.selector.init(node);
    this.__parents = this.selector.find();

  };

  FirstChildRequest.prototype.find = function() {

    if(this.__parents instanceof RequestError) {
      return this.__parents;
    }
    else {
      this.__results = [];
      this.__findChilds();

      if(this.__results.length > 0) {
        return this.__results;
      }
      else {
        return new RequestError(this.error);
      }

    }

  };

  /**
  * Vérifie que la requête match des éléments enfants.
  */
  var HasChildRequest = function(selector, request) {
    this.selector = selector;
    this.request = request;
    this.__results = null;
    this.__parents = null;
  };

  __extends(HasChildRequest, Request);

  /**
  * Récupère les enfants d'un parent.
  */
  HasChildRequest.prototype.__findIn = function(node) {

    var self = this;

    node.walk(function() {
      self.request.init(this);
      if(!(self.request.find(this) instanceof RequestError)) {
        this.reset();
        self.__results.push(this);
      }
    });

  };

  /**
  * Récupère les enfants de tous les parents.
  */
  HasChildRequest.prototype.__findChilds = function() {

    if(Array.isArray(this.__parents)) {
      for(var i = 0; i < this.__parents.length; ++i) {
        this.__findIn(this.__parents[i]);
      }
    }
    else {
      this.__findIn(this.__parents);
    }

  };

  HasChildRequest.prototype.init = function(node) {

    this.selector.init(node);
    this.__parents = this.selector.find();

  };

  HasChildRequest.prototype.find = function() {

    if(this.__parents instanceof RequestError) {
      return this.__parents;
    }
    else {
      this.__results = [];
      this.__findChilds();

      if(this.__results.length > 0) {
        return this.__results;
      }
      else {
        return new RequestError(this.error);
      }

    }

  };

  /**
  * Vérifie que la requête match des éléments enfants.
  */
  var NodeTypeRequest = function(type) {
    this.type = type;
  };

  __extends(NodeTypeRequest, Request);

  NodeTypeRequest.prototype.find = function() {

    if(this.node.is(this.type)) {
      return this.node;
    }
    else {
      return new RequestError(this.error);
    }

  };

  /**
  * Vérifie que la requête match une fonction particulière
  */
  var FunctionRequest = function(identifier) {
    this.identifier = identifier;
  };

  __extends(FunctionRequest, Request);

  NodeTypeRequest.prototype.find = function() {

    if(this.node.is('function')) {

      if(__defined(this.identifier) && this.node.identifier() != this.identifier) {
        return new RequestError(this.error);
      }

      return this.node;

    }

    return new RequestError(this.error);

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

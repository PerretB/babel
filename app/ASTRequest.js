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

  var ValidationResult = function(alias, error) {

    this.__nextDefault = 0;
    this.errors = {};

    if(__undefined(alias)) {
      alias = this.__nextDefault;
      this.__nextDefault += 1;
    }

    if(__defined(error)) {
      this.errors[alias] = error;
    }

  };

  ValidationResult.prototype.isValid = function() {
    return this.length() <= 0;
  };

  ValidationResult.prototype.length = function() {
    var size = 0;
    for (var key in this.errors) {
        if (this.errors.hasOwnProperty(key)) {
          size++;
        }
    }
    return size;
  };

  ValidationResult.prototype.get = function(alias) {
    return this.errors[alias];
  };

  ValidationResult.prototype.each = function(callback, args) {

    var run = true;

    for(var alias in this.errors) {
      var error = {alias:alias, error:this.errors[alias]};

      if(__defined(args)) {
        run = callback.apply(error, args);
      }
      else {
        run = callback.call(error, error);
      }
    }

  };

  ValidationResult.prototype.add = function(alias, error) {

    if(alias instanceof ValidationResult) {
      var self = this;
      alias.each(function() {
        self.errors[this.alias] = this.error;
      });
    }
    else {
      if(__undefined(alias)) {
        alias = this.__nextDefault;
        this.__nextDefault += 1;
      }
      this.errors[alias] = error;
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

  Request.prototype.validate = function(node) {

    var result = this.find(node);

    if(result.isEmpty()) {
      return new ValidationResult(this.alias, this.error);
    }
    else {
      return new ValidationResult();
    }

  };

  Request.prototype.error = "Not found.";
  Request.prototype.alias = null;

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

  ConcatRequest.prototype.validate = function(node) {

    var result = new ValidationResult();

    var first  = this.first.validate(node);
    var second = this.second.validate(node);

    result.add(first);
    result.add(second);

    return result;

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

  FirstChildRequest.prototype.validate = function(node) {

    var result = new ValidationResult();
    result.add(this.selector.validate(node));

    if(result.isValid()) {
      var childs = this.find(node);

      if(childs.isEmpty()) {
        result.add(this.alias, this.error);
      }
    }

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

  HasChildRequest.prototype.validate = function(node) {

    var result = new ValidationResult();
    result.add(this.selector.validate(node));

    if(result.isValid()) {
      var childs = this.find(node);

      if(childs.isEmpty()) {
        result.add(this.alias, this.error);
      }
    }

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
    return request;
  };

  return lib;

})();

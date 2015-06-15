(function(){

  var dependencies = [

  ];

  var module = angular.module("babel.ast.request", dependencies);

  /**
  * Collection retourné par une fonction de validation.
  *
  * @param string alias Nom de l'erreur.
  * @param string error Message d'erreur.
  */
  var ValidationResult = function(alias, error) {

    this.__nextDefault = 0;
    this.errors = {};

    if(!angular.isDefined(alias)) {
      alias = this.__nextDefault;
      this.__nextDefault += 1;
    }

    if(angular.isDefined(error)) {
      this.errors[alias] = error;
    }

  };

  /**
  * Retourne true si la validation a réussi.
  *
  * @return boolean true si la validation a réussi.
  */
  ValidationResult.prototype.isValid = function() {
    return this.length() <= 0;
  };

  /**
  * Nombre d'erreurs levées.
  *
  * @return Number Nombre d'erreurs levées.
  */
  ValidationResult.prototype.length = function() {
    var size = 0;
    for (var key in this.errors) {
        if (this.errors.hasOwnProperty(key)) {
          size++;
        }
    }
    return size;
  };

  /**
  * Retourne un message d'erreur à partir du nom de l'erreur.
  *
  * @param string alias Nom de l'erreur.
  * @return string Message d'erreur.
  */
  ValidationResult.prototype.get = function(alias) {
    return this.errors[alias];
  };

  /**
  * Parcourt la liste des erreurs levées.
  */
  ValidationResult.prototype.each = function(callback, args) {

    var run = true;

    for(var alias in this.errors) {
      var error = {alias:alias, error:this.errors[alias]};

      if(angular.isDefined(args)) {
        run = callback.apply(error, args);
      }
      else {
        run = callback.call(error, error);
      }
    }

  };

  /**
  * Ajoute une erreur.
  *
  * @param string | ValidationResult Message(s) d'erreurs.
  * @param string alias (optionel) Nom de l'erreur.
  */
  ValidationResult.prototype.add = function(error, alias) {

    if(error instanceof ValidationResult) {
      var self = this;
      error.each(function() {
        self.errors[this.alias] = this.error;
      });
    }
    else {
      if(!angular.isDefined(alias)) {
        alias = this.__nextDefault;
        this.__nextDefault += 1;
      }
      this.errors[alias] = error;
    }
  };

  /**
  * Collection contenant le résultat d'une requête.
  *
  * @param object | Array value (optionel) Valeurs.
  */
  var RequestResult = function(value) {
    if(Array.isArray(value)) {
      this.nodes = value;
    }
    else if(angular.isDefined(value)) {
      this.nodes = [value];
    }
    else {
      this.nodes = [];
    }
  };

  /**
  * Vérifie si des résultats ont été trouvés.
  * @return boolean true si des résultats ont été retournés.
  */
  RequestResult.prototype.isEmpty = function() {
    return this.nodes.length <= 0;
  };

  /**
  * @return Number Le nombre de résultats retournés.
  */
  RequestResult.prototype.length = function() {
    return this.nodes.length;
  };

  /**
  * Retourne le ième résultat.
  *
  * @param Number i Numéro du résultat à retourné.
  *
  * @return object Le ième résultat retourné.
  */
  RequestResult.prototype.get = function(i) {
    return this.nodes[i];
  };

  /**
  * Parcourt la liste des résultats.
  */
  RequestResult.prototype.each = function(callback, args) {

    var run = true;

    for(var i = 0; i < this.nodes.length && run !== false; ++i) {

      if(angular.isDefined(args)) {
        run = callback.apply(this.nodes[i], args);
      }
      else {
        run = callback.call(this.nodes[i], this.nodes[i]);
      }

    }

  };

  /**
  * Ajoute un résultat.
  */
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

  /**
  * Effectue une recherche sur un ou plusieurs noeud.
  *
  * @param Node | Array | RequestResult Noeud(s).
  *
  * @return RequestResult Le résultat de la requête.
  */
  Request.prototype.find = function(node) {

    if(node instanceof RequestResult) {

      var result = new RequestResult();
      var self = this;

      node.each(function() {
        result.add(self.__find(this));
      });

      return result;

    }
    else if(node instanceof Array) {

      var result = new RequestResult();

      for(var i = 0; i < node.length; ++i) {
        result.add(self.__find(node[i]));
      }

      return result;

    }
    else {
      return this.__find(node);
    }

  };

  /**
  * Tente de trouver quelque chose après un appel à find.
  */
  Request.prototype.__find = function(node) {

    if(angular.isDefined(node)) {
      return new RequestResult(node);
    }
    else {
      return new RequestResult();
    }

  };

  /**
  * Valide un noeud à l'aide d'une requête.
  *
  * @param Node | Array | RequestResult node.
  *
  * @return ValidationResult Résultat de la validation.
  */
  Request.prototype.validate = function(node) {

    var result = this.find(node);

    if(result.isEmpty()) {
      return new ValidationResult(this.error, this.alias);
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

  ConcatRequest.prototype = new Request();

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

  FirstChildRequest.prototype = new Request();

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
        result.add(this.error, this.alias);
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

  HasChildRequest.prototype = new Request();

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
        result.add(this.error, this.alias);
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

  NodeTypeRequest.prototype = new Request();

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

  FunctionRequest.prototype = new Request();

  FunctionRequest.prototype.__find = function(node) {

    if(node.is('function')) {

      if(angular.isDefined(this.identifier) && node.identifier() != this.identifier) {
        return new RequestResult();
      }

      return new RequestResult(node);

    }

    return new RequestResult();

  };

  /**
  * Filtre
  */
  var FilterRequest = function(findRequest, filterRequest) {
    this.findRequest = findRequest;
    this.filterRequest = filterRequest;
  };

  FilterRequest.prototype = new Request();

  FilterRequest.prototype.__find = function(node) {

    var self = this;
    var findResult = this.findRequest.find(node);
    var filteredResult = new RequestResult();

    findResult.each(function() {

      if(!self.filterRequest.find(this).isEmpty()) {
        filteredResult.add(this);
      }

    });

    return filteredResult;

  };

  FilterRequest.prototype.validate = function(node) {

    var result = new ValidationResult();
    result.add(this.findRequest.validate(node));

    if(result.isValid()) {
      var childs = this.find(node);

      if(childs.isEmpty()) {
        result.add(this.error, this.alias);
      }
    }

    return result;

  };

  /**
  * Negation Filtre
  */
  var NegFilterRequest = function(findRequest, filterRequest) {
    this.findRequest = findRequest;
    this.filterRequest = filterRequest;
  };

  NegFilterRequest.prototype = new Request();

  NegFilterRequest.prototype.__find = function(node) {

    var self = this;
    var findResult = this.findRequest.find(node);
    var filteredResult = new RequestResult();

    findResult.each(function() {

      if(self.filterRequest.find(this).isEmpty()) {
        filteredResult.add(this);
      }

    });

    return filteredResult;

  };

  NegFilterRequest.prototype.validate = function(node) {

    var result = new ValidationResult();
    result.add(this.findRequest.validate(node));

    if(result.isValid()) {
      var childs = this.find(node);

      if(childs.isEmpty()) {
        result.add(this.error, this.alias);
      }
    }

    return result;

  };

  module.service('$ASTRequest', function() {

    /**
    * Retourne une requête nulle, celle-ci retournera systématiquement le noeud
    * passé en paramètre.
    */
    this.$rootNode = function() {
      return new Request();
    };

    /**
    * Retourne la requête passée en paramètre.
    */
    this.$identity = function(request) {
      return request;
    };

    /**
    * Créée la concaténation du résultat des deux requêtes.
    */
    this.$concat = function(first, second) {
      return new ConcatRequest(first, second);
    };

    /**
    * Créée une requête sur les premiers enfant d'un ensemble d'éléments.
    */
    this.$firstChild = function(selector, request) {
      return new FirstChildRequest(selector, request);
    };

    /**
    * Créée une requête sur les enfants d'un ensemble d'éléments.
    */
    this.$has = function(selector, request) {
      return new HasChildRequest(selector, request);
    };

    /**
    * Cherche un type de noeud.
    */
    this.$node = function(type) {
      return new NodeTypeRequest(type);
    };

    /**
    * Cherche une fonction particulière.
    */
    this.$functionNode = function(identifier) {
      return new FunctionRequest(identifier);
    };

    /**
    * Assigne un alias à la requête.
    */
    this.$alias = function(request, alias) {
      request.alias = alias;
      return request;
    };

    /**
    * Filtre le résultat d'une requête... par une autre requête.
    */
    this.$filter = function(request, filter) {
      return new FilterRequest(request, filter);
    };

    /**
    * Filtre inversé du résultat d'une requête... par une autre requête.
    */
    this.$negfilter = function(request, filter) {
      return new NegFilterRequest(request, filter);
    };

    /**
    * Change le message d'erreur d'une requête.
    */
    this.$defineError = function(request, error) {
      request.error = error;
      return request;
    };

    return this;

  });

})();

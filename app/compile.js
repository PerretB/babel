(function() {

  var dependencies = [

  ];

  var module = angular.module("babel.compile", dependencies);

  module.service("$compileJS", function() {

    var $cmdContent = "";

    var initInterpreter = function(interpreter, codeScope) {

      $cmdContent = "";

      var wrapper = function(text) {
        text = text ? text.toString() : '';
        if($cmdContent == "") {
          $cmdContent = text;
        }
        else {
          $cmdContent = $cmdContent + "\n" + text;
        }
      };

      interpreter.setProperty(codeScope, 'alert',
        interpreter.createNativeFunction(wrapper)
      );

    };

    this.$execute = function(code) {
          try {
                interpreter = new Interpreter(code, initInterpreter);
                interpreter.run();

                return $cmdContent;
          }
          catch (e) {
                return "" + e;
          }
    };

    return this;

  });

})();

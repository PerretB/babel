/*
* Permet de parser une commande pour créer un validateur d'AST.
* En particulier : scripts js.
*/

%lex

%%

\s+                                  /* Skip les caractères vides (espaces) */

[0-9]+                  return "INTEGER";

"root"                  return "ROOT";
"function"              return "FUNCTION";
"return"                return "RETURN";
"var"                   return "VAR";
"as"                    return "ALIAS";
"with error message"    return "DEFINE_ERROR";

","                     return ",";
">"                     return ">";
"."                     return ".";
"+"                     return "+";

"("                     return "(";
")"                     return ")";
"["                     return "[";
"]"                     return "]";
"{"                     return "{";
"}"                     return "}";

L?\"(\\.|[^\\"])*\"     return "STR"; /* "\"" ([^\"\\]*|"\\\""|"\\")* "\"" */

[a-zA-Z][a-zA-Z0-9]*    return "IDENTIFIER";

<<EOF>>                 return "EOF"

/lex

%start requests

%%

requests :
           request ',' request    {$$ = ASTRequest.concat($1, $2);}
         | request EOF            {return ASTRequest.identity($1);}
         ;

request :
          request_unit '.' request              {$$ = ASTRequest.firstChild($1, $3);}
        | request_unit '>' request              {$$ = ASTRequest.has($1, $3);}
        | request_unit                          {$$ = ASTRequest.identity($1);}
        ;

/*  request AS IDENTIFIER request         {$$ = ASTRequest.alias($1, $3);}
| request DEFINE_ERROR STR request      {$$ = ASTRequest.defineError($1, $3.substring(1, $3.length-1));}*/
// '(' request ')'                {$$ = ASTRequest.identity($2);}
request_unit :
               node                           {$$ = ASTRequest.identity($1);}
             ;


node :
       RETURN                         {$$ = ASTRequest.node("return");}
     | ROOT                           {$$ = ASTRequest.rootNode();}
     | FUNCTION IDENTIFIER            {$$ = ASTRequest.functionNode($2);}
     | FUNCTION                       {$$ = ASTRequest.node("function");}
     ;

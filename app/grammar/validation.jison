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
/*"return"                return "RETURN";*/
"named"                 return "ALIAS";
"error"                 return "DEFINE_ERROR";

":"                     return ":";
","                     return ",";
">"                     return ">";
"."                     return ".";
"+"                     return "+";
"with"                  return "FILTER"

"("                     return "(";
")"                     return ")";
"["                     return "[";
"]"                     return "]";
"{"                     return "{";
"}"                     return "}";
"!"                     return "!";

L?\"(\\.|[^\\"])*\"     return "STR"; /* "\"" ([^\"\\]*|"\\\""|"\\")* "\"" */

[a-zA-Z][a-zA-Z0-9]*    return "IDENTIFIER";

<<EOF>>                 return "EOF"

/lex

%start requests

%%

requests :
           request ',' request        {$$ = $ASTRequest.$concat($1, $2);}
         | request EOF                {return $ASTRequest.$identity($1);}
         ;

request :
          request '.' request_unit    {$$ = $ASTRequest.$firstChild($1, $3);}
        | request '>' request_unit    {$$ = $ASTRequest.$has($1, $3);}
        | request FILTER request_unit {$$ = $ASTRequest.$filter($1, $3);}
        | request '[' DEFINE_ERROR ':' string ']' {$$ = $ASTRequest.$defineError($1, $5);}
        | request '[' ALIAS ':' IDENTIFIER ']'    {$$ = $ASTRequest.$alias($1, $5);}
        | request_unit                {$$ = $ASTRequest.$identity($1);}
        ;

string :
         STR                          {$$ = $1.substring(1, $1.length-1);}
       ;

request_unit :
         node                         {$$ = $ASTRequest.$identity($1);}
       | "{" request "}"              {$$ = $ASTRequest.$identity($2);}
       ;


node :
       ROOT                           {$$ = $ASTRequest.$rootNode();}
     | FUNCTION IDENTIFIER            {$$ = $ASTRequest.$functionNode($2);}
     | FUNCTION                       {$$ = $ASTRequest.$node("function");}
     | IDENTIFIER                     {$$ = $ASTRequest.$node($1);}
     ;

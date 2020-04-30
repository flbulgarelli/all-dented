const {lex, Lexer, PrettyPrinter} = require('../src/index');
const assert = require('assert');

function prettyPrint(code) {
  let result = lex(code).map((token) => token.value);
  return result.join('');
}

describe("Lexer", () => {
  function lexes(code, tokens) {
    it(code, () => { assert.deepEqual(lex(code, { squeeze: true, trim: true }), tokens) });
  }

  lexes("", []);
  lexes(";", [Lexer.SEMI]);
  lexes(";;", [Lexer.SEMI, Lexer.SEMI]);
  lexes("({})", [Lexer.OPEN_PAREN, Lexer.OPEN_BRACE, Lexer.CLOSE_BRACE, Lexer.CLOSE_PAREN]);
  lexes("'foo'", [Lexer.string("'foo'")]);
  lexes('"foo"', [Lexer.string('"foo"')]);
  lexes('"foo";"bar"', [Lexer.string('"foo"'), Lexer.SEMI, Lexer.string('"bar"')]);
  lexes('foo', [Lexer.identifier("foo")]);
  lexes('foo bar baz', [Lexer.identifier("foo"), Lexer.WHITESPACE, Lexer.identifier("bar"), Lexer.WHITESPACE, Lexer.identifier("baz")]);
  lexes('foo  bar', [Lexer.identifier("foo"), Lexer.WHITESPACE, Lexer.identifier("bar")]);
  lexes('foo\nbar\nbaz', [Lexer.identifier("foo"), Lexer.NEWLINE, Lexer.identifier("bar"), Lexer.NEWLINE, Lexer.identifier("baz")]);
  lexes('foo\n bar\n baz', [Lexer.identifier("foo"), Lexer.NEWLINE, Lexer.identifier("bar"), Lexer.NEWLINE, Lexer.identifier("baz")]);
  lexes('foo\n  bar\n  baz', [Lexer.identifier("foo"), Lexer.NEWLINE, Lexer.identifier("bar"), Lexer.NEWLINE, Lexer.identifier("baz")]);
  lexes('foo  \n  bar  \n  baz', [Lexer.identifier("foo"), Lexer.NEWLINE, Lexer.identifier("bar"), Lexer.NEWLINE, Lexer.identifier("baz")]);
  lexes('// foo', [Lexer.comment(" foo")]);
  lexes('// foo\n', [Lexer.comment(" foo"), Lexer.NEWLINE]);
  lexes('// foo\n// bar\n', [Lexer.comment(" foo"), Lexer.NEWLINE, Lexer.comment(" bar"), Lexer.NEWLINE]);
  lexes('x// foo\n// bar\n', [Lexer.identifier("x"), Lexer.comment(" foo"), Lexer.NEWLINE, Lexer.comment(" bar"), Lexer.NEWLINE]);
  lexes('x\n// foo\n// bar\n', [Lexer.identifier("x"), Lexer.NEWLINE, Lexer.comment(" foo"), Lexer.NEWLINE, Lexer.comment(" bar"), Lexer.NEWLINE]);
  lexes('// foo\nx\n// bar\n', [Lexer.comment(" foo"), Lexer.NEWLINE, Lexer.identifier("x"), Lexer.NEWLINE, Lexer.comment(" bar"), Lexer.NEWLINE]);

  ["procedure PrenderOApagarLuz () {\r\n  if (hayBolitas (Negro)) {\r\n    Poner (Verde)\r\n    Sacar (Negro)\r\n } else {  \r\n   if (not hayBolitas (Negro)) {\r\n     }\r\n}\r\n  if (hayBolitas (Verde)) {\r\n    Poner (Negro)\r\n    Sacar (Verde)\r\n   } else {  \r\n   if (not hayBolitas (Negro)) {\r\n     }\r\n}\r\n}\r\n  \r\n ",
 "procedure Fecha(dia, mes, anio){\r\n \r\n  PonerN(dia)\r\n Mover(Este)\r\n  PonerN(mes)\r\n  Mover(Este)\r\n  PonerN(anio)\r\n  }\r\n",
 "function gananciasDeBalancesPositivos(balancesPositivos){\r\n  let lista=[]\r\n  for (let promedio of balancesPositivos) {\r\n    if (promedio>0){\r\n      agregar (lista,balance.ganancia)\r\n    }\r\n  }\r\n  return lista\r\n}",
 "let flanCasero = { ingredientes: [\"huevos\", \"leche\", \"azúcar\", \"vainilla\"], tiempoDeCoccion: 50 }\r\nlet cheesecake = { ingredientes: [\"queso crema\", \"frambuesas\"], tiempoDeCoccion: 80 }\r\nlet lemonPie = { ingredientes: [\"jugo de limón\", \"almidón de maíz\", \"leche\", \"huevos\"], tiempoDeCoccion: 65 }\r\n\r\nfunction masDificilDeCocinar (postre1, postre2) \r\n{\r\nlongitud(postre1)===longitud(postre2)\r\n   return postre1||postre2;\r\n}\r\nfunction masDificilDeCocinar (postre1,postre2){\r\n  longitud(postre1)>=longitud(postre2)\r\n return postre1;\r\n                                 }\r\n",
 " function decisionConMoneda (moneda, comida1, comida2){\r\n   if (moneda = \"cara\") {\r\n     return comida1\r\n   }\r\n   else {\r\n     return comida2\r\n   } \r\n }\r\n  ",
 "procedure PrenderOApagarLuz () {\r\n  if (not hayBolitas (Negro)) {\r\n    Poner (Negro)\r\n  } else {\r\n    Poner (Verde)\r\n  }\r\n}",
 "function escribirCartelito(ttlo,nom,ap) {\r\n  return \"ttlo+nom+ap\";\r\n}  ",
 "program {\r\n  Mover (Norte)\r\n  Mover (Norte)\r\n  Mover (Este)\r\n  Poner (Azul)\r\n  Mover (Este)\r\n  Poner (Azul)\r\n  Mover (Este)\r\n  Poner (Azul)\r\n  Mover (Este)\r\n  Poner (Azul)\r\n  Mover (Sur)\r\n  Mover (Oeste)\r\n  Poner (Rojo)\r\n  Mover (Este)\r\n  Mover (Este)\r\n  Mover (Sur)\r\n  Poner (Azul)\r\n  Mover (Oeste)\r\n  Poner (Azul)\r\n  Mover (Oeste)\r\n  Poner (Azul)\r\n  Mover (Oeste)\r\n  Poner (Azul)\r\n}",
 "function puedeJubilarse(sexo,edad,ap){\r\n\r\n return((sexo=='M' && edad >= 65 && ap>= 30)||(sexo=='F' && edad>=60 && ap>=30))\r\n  }",
 "program {\r\n  if (nroBolitas(Verde)>5){\r\n    Poner(Negro)\r\n  }\r\n}",
 "function trasladar(unaLista, otraLista) {\r\n  return remover(unaLista);\r\n  return agregar(otraLista,remover(unaLista) );\r\n}",
 "procedure PonerLineaMulticolor4() {\r\n  Mover(Norte)\r\n  Poner(Azul)\r\n  Poner(Negro)\r\n  Poner(Rojo)\r\n  Poner(Verde)\r\n  Mover(Oeste)\r\n  Poner(Azul)\r\n  Poner(Negro)\r\n  Poner(Rojo)\r\n  Poner(Verde)\r\n  Mover(Oeste)\r\n  Poner(Azul)\r\n  Poner(Negro)\r\n  Poner(Rojo)\r\n  Poner(Verde)\r\n  Mover(Oeste)\r\n  Poner(Azul)\r\n  Poner(Negro)\r\n  Poner(Rojo)\r\n  Poner(Verde)\r\n  Mover(Oeste)\r\n  Poner(Azul)\r\n  Poner(Negro)\r\n  Poner(Rojo)\r\n  Poner(Verde)\r\n  \r\n}\r\n\r\nprogram {\r\nPonerLineaMulticolor4()\r\n  \r\n}",
 "procedure PonerN(cantidad,color){\r\n  repeat(2){\r\n  Poner(cantidad,color)}\r\n}\r\n",
 "function puntosDeEnvidoTotales(valor1, valor2, palo1, palo2) {if (palo1===palo2) {return (valorEnvido(valor1)+ valorEnvido(valor2))+20;} \r\nelse {return Math.max((valorEnvido(valor1)),(valorEnvido(valor2)));}}",
 "procedure LineaRoja4() {\r\n  repeat(4) {\r\n    Poner(Rojo)\r\n    Mover(Norte)\r\n  }\r\n}",
 "function estaAfinado(frecuencia){\r\n return frecuencia===440;\r\n}\r\nfunction estaAfinado(piano){\r\n  return piano==440\r\n}",
 "function longitudNombreCompleto(nombre, apellido){\r\n  return longitud(nombre + apellido+1);\r\n}",
 "function gananciasDeBalancesPositivos(balancesPositivos){\r\n  let lista=[]\r\n  for (let balance of balancesPositivos) {\r\n    if (balance.ganancia>0){\r\n      agregar (lista,balance.ganancia)\r\n    }\r\n  }\r\n  return lista\r\n}",
 "procedure Fecha(dia, mes, anio){\r\n  PonerN(dia, color)\r\n Mover(Este)\r\n  PonerN(mes, verde)\r\n  Mover(Este)\r\n  PonerN(anio, negro)\r\n  }\r\n",
 "procedure LineaEstePesada(peso, color, longitud) {\r\n  repeat(longitud) {\r\n    PonerN(peso, color)\r\n    Mover(Este)\r\n  }\r\n  MoverN(longitud, Oeste)\r\n}",
 "function ganancias(balances) {\r\n  let ganancias = [];\r\n  for (let balance of balances) {\r\n    if (balances.ganancia > 0){\r\n      agregar(\"ganancias\",balances.ganancia)\r\n    }\r\n  }\r\n  return ganancias;\r\n}\r\n",
 "function anterior(numero) {\r\n  return numero-1\r\n}\r\n\r\nfunction triple(numero){\r\n  return numero*3\r\n}\r\n\r\nfunction anteriorDelTriple(numero)  {\r\n  return anterior(triple(numero))\r\n}",
 "function estaCerca(afinado){\r\nreturn (\"afinado\" > 437 &&   443  !==440)\r\n}",
 "procedure PonerN(cantidad,color) {\r\n  \r\n  repeat(4) {\r\n    Poner(Verde)\r\n    }\r\n  }\r\n\r\n \r\n  ",
 "function estaCerrado(esFeriado, dia, horario) {\r\n  return !(esFeriado) && !esFinDeSemana(dia) && dentroDeHorarioBancario(horario);\r\n}\r\n\r\nfunction esFinDeSemana(dia) {\r\n  return dia != \"sábado\" && \"domingo\"; \r\n}\r\n\r\n",
 "function TienenElMismoPadre(hijo1, hijo2){\r\n  return (padreDe(hijo1) == padreDe(hijo2));\r\n}\r\nfunction TienenLaMismaMadre(hijo3, hijo4){\r\nreturn madreDe(hijo3) == madreDe(hijo4);\r\n}\r\nfunction sonHermanos (hermano1, hermano2){\r\n  return (TienenLaMismaMadre(persona1,persona2) && TienenElMismoPadre(persona1, persona2));\r\n}\r\n\r\nfunction sonMediosHermanos(persona1, persona2){\r\n  return (TienenLaMismaMadre(persona1,persona2) || TienenElMismoPadre(persona1, persona2)) && !sonHermanos (persona1,persona2);\r\n}\r\n",
 "let unaLista = [1, 2, 3];\r\nlet otraLista = [4, 5];\r\n\r\nfunction trasladar(unaLista, otraLista){\r\nreturn agregar(otralista,\"unalista\")\r\nreturn agregar(unalista,\"otralista\")\r\n\r\n}",
 "function puedeJubilarse(edad, sexo,aportes){\r\n  return ((edad>=60 && sexo===\"F\" && aportes>=30===\"true\")||(edad>=65 && sexo===\"M\" && aportes>=30===\"true\"));\r\n}",
 "program {\r\n  Poner (Rojo)\r\n  Poner (Rojo)\r\n  Poner (Rojo)\r\n  Poner (Rojo)\r\n  Poner (Negro)\r\n  Poner (Negro)\r\n  Poner (Negro)\r\n  }",
 "procedure AsegurarUnaBolitaVerde(){\r\nif (not hayBolitas(Verde)){\r\nPoner(Verde)}\r\n}",
 "function estaCerca(afinado){\r\n return afinado>=437 && afinado<=443 && afinado!== 440\r\n}\r\n",
 "procedure MoverOeste10() \r\n{\r\n  Mover(Oeste)\r\n  Mover(Oeste)\r\n  Mover(Oeste)\r\n  Mover(Oeste)\r\n  Mover(Oeste)\r\n  Mover(Oeste)\r\n  Mover(Oeste)\r\n  Mover(Oeste)\r\n  Mover(Oeste)\r\n  Mover(Oeste)\r\n}\r\n",
 "procedure PonerLineaMulticolor4(){\r\n  Poner(Rojo)\r\n  Poner(Negro)\r\n  Poner(Azul)\r\n  Poner(Verde)\r\n  IrAlBorde(Este)\r\n  Mover(Oeste)\r\n   Poner(Rojo)\r\n  Poner(Negro)\r\n  Poner(Azul)\r\n  Poner(Verde)\r\n Poner(Rojo)\r\n  Poner(Negro)\r\n  Poner(Azul)\r\n  Poner(Verde)\r\n IrAlBorde(Oeste)\r\n  }\r\nprogram{ PonerLineaMulticolor4()\r\n}",
 "function medallaSegunPuesto(puesto) {\r\n  \r\n  if (puesto > 3)\r\n    return nada;\r\n  \r\n}",
 "function estaCerrado(esFeriado, dia, horario) {\r\n  return (esFeriado) && !esFinDeSemana(dia) && !dentroDeHorarioBancario(horario);\r\n}\r\n\r\nfunction esFinDeSemana(dia) {\r\n  return dia != \"sábado\" && \"domingo\"; \r\n}\r\n\r\n",
 "function puedeJubilarse(edad, sexo,aportes){\r\n  return (edad>=60 && sexo===\"F\"||sexo===\"M\" && aportes>=30)===\"true\";\r\n}",
 "procedure DibujarReloj(radio) {\r\n  MoverN(2, Norte)\r\n  PonerN(12, Rojo)\r\n  MoverN(2, Sur)\r\n}",
 "function extraer(saldo, monto) {\r\n  return Math.max(100 - 20,0)\r\n  return Math.max(100 - 10,0)\r\n  return Math.max(100 -  0,0)\r\n  return Math.max(100 - 100,0)\r\n  return Math.max(100 - 120,0)\r\n  return Math.max(100 - 220,0);\r\n}",
 "program{\r\n  Poner(Azul)\r\n  Mover(Este)\r\n  Poner(Azul)\r\n  Mover(Este)\r\n  Poner(Azul)\r\n  Mover(Este)\r\n  Poner(Azul)\r\n  Mover(Este)\r\n  Poner(Azul)\r\n  Mover(Norte)\r\n  Mover(Norte)\r\n  Poner(Azul)\r\n  Mover(Oeste)\r\n  Poner(Azul)\r\n  Mover(Oeste)\r\n  Poner(Azul)\r\n  Mover(Oeste)\r\n  Poner(Azul)\r\n  Mover(Oeste)\r\n  Poner(Azul)\r\n  Mover(Sur)\r\n  Mover(Este)\r\n  Mover(Este)\r\n  Poner(Rojo)\r\n  Mover(Sur)\r\n  Mover(Oeste)\r\n  Mover(Oeste)\r\n}",
 "procedure DibujarLinea3(color){\r\n  repeat(2){\r\n    Poner(color)\r\n    Mover(Este)\r\n  }\r\n  Poner(color)\r\n  VolverAtras()\r\n}"].forEach((code) => {
   it(code, () => {
    assert.equal(code, prettyPrint(code));
   })
 })
})


function format(code) {
  return new PrettyPrinter(code,
    [
      {keyword: 'function'},
      {keyword: 'procedure'},
      {keyword: 'if'},
      {keyword: 'else', trailing: true},
      {keyword: 'repeat'}
    ],
    [Lexer.OPEN_BRACE],
    [Lexer.CLOSE_BRACE]
  ).prettyPrint();
}

describe("format", () => {
  function prints(code, pretty) {
    it(code, () => { assert.deepEqual(format(code), pretty) });
  }


  prints(("foo();bar();baz()"), "foo();\nbar();\nbaz()");
  prints((""), "");
  prints(("let x = 1;\n"), "let x = 1;\n");
  prints(("x\n"), "x\n");

  describe("ifs", () => {
    prints(("if (true) {\nconsole.log('ups')\n}\n"), "if (true) {\n  console.log('ups')\n}\n");
    prints(("if(true){\nconsole.log('ups')\n}\n"), "if (true) {\n  console.log('ups')\n}\n");

    prints(("if(true){console.log('ups')}else{console.log('ok')}"), "if (true) {\nconsole.log('ups')\n} else {\nconsole.log('ok')\n}\n");
    prints(("if(true){console.log('ups')}else if (false) {console.log('ok')}"), "if (true) {\n  console.log('ups')\n} else if (false) {\n  console.log('ok')\n}\n");
    prints(("x = 4\nif(true){console.log('ups')}else if (false) {console.log('ok')}x = 5\nx = 8"), "x = 4\nif(true) {\n  console.log('ups')\n} else if (false) {\n  console.log('ok')\n}\nx = 5\nx = 8");
  });


  describe("functions", () => {
    prints("function foo(){let x = 1; let y = 2; if(true){console.log(y)}}", "function foo() {\nlet x = 1;\n let y = 2;\n \nif (true) {\nconsole.log(y)\n}\n}\n");

    prints("function foo() {\n}\n", "function foo() {\n}\n");
    prints("function foo() {\n}\n\nfunction bar() {\n}\n", "function foo() {\n}\nfunction bar() {\n}\n");
    prints("function foo() {\n}function bar() {\n}\n", "function foo() {\n}\nfunction bar() {\n}\n");

    prints("function(x) {\n}\n", "function (x) {\n}\n");
    prints("function(x){return 2;}", "function (x) {\nreturn 2;\n}\n");
    prints("function(x){return 2}", "function (x) {\nreturn 2\n}\n");

    prints("function foo(x) {\n}\n", "function foo(x) {\n}\n");
    prints(" function foo(x) {\n}\n", " \nfunction foo(x) {\n}\n");
    prints("\n\nfunction foo(x) {\n}\n", "\nfunction foo(x) {\n}\n");
    prints("\n\n  function foo(x) {\n}\n", "\nfunction foo(x) {\n}\n");
    prints("\n \n  function foo(x) {\n}\n", "\nfunction foo(x) {\n}\n");
    prints(" \n \n  function foo(x) {\n}\n", "\nfunction foo(x) {\n}\n");

    prints("function foo (x) {\n}\n", "function foo(x) {\n}\n");
    prints("function foo (x, y) {\n}\n", "function foo(x, y) {\n}\n");
    prints("function foo (  x, y ) {\n}\n", "function foo(x, y) {\n}\n");
    prints("function foo (x, y) {}\n", "function foo(x, y) {\n}\n");
    prints("function (x, y) {}\n", "function (x, y) {\n}\n");
  });

  describe("procedures", () => {
    prints("procedure Foo(x) {\n}\n", "procedure Foo(x) {\n}\n");
    prints("procedure Foo (x) {\n}\n", "procedure Foo(x) {\n}\n");
    prints("procedure Foo (x, y) {\n}\n", "procedure Foo(x, y) {\n}\n");
    prints("procedure Foo (  x, y ) {\n}\n", "procedure Foo(x, y) {\n}\n");
    prints("procedure Foo (x, y) {}\n", "procedure Foo(x, y) {\n}\n");
  });

  xdescribe("defs", () => {
    prints("def foo(x)\nend", "def foo(x)\nend");
    prints("def foo (x)\nend", "def foo(x)\nend");
    prints("def foo (x, y)\nend", "def foo(x, y)\nend");
    prints("def foo (  x, y )\nend", "def foo(x, y)\nend");
    prints("def foo (  x, y )end", "def foo(x, y)\nend");
    prints("def foo! (  x, y )end", "def foo!(x, y)\nend");
    prints("def foo? (  x, y )end", "def foo?(x, y)\nend");
  });
});

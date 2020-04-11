const assert = require('assert');

function format(it) {
  return it
    .replace(/;\n?/g, `;\n`)
    .replace(/(function|procedure)\s*(\w+)\s*\(\s*([\w\s,\.]*?)\s*\)\s*\{\n?/g, `$1 $2($3) {\n`)
    .replace(/(def)\s*(\w+[!\?]?)\s*\(\s*([\w\s,\.]*?)\s*\)\s*?\n?/g, `$1 $2($3)\n`)
    .replace(/(if)\s*\((.*?)\)\s*?\n?/g, `$1 $2($3)\n`);
}

class Lexer {
  constructor(code, options) {
    this.tokens = [];
    this.index = 0;
    this.code = code;
    this.options = options || {};
  }

  notEnd() {
    return this.index < this.code.length;
  }

  advance() {
    this.current = this.code.charAt(this.index);
    this.index++;
    return this.current;
  }

  push(token) {
    this.tokens.push(token);
  }

  lookAhead() {
    return this.code.charAt(this.index);
  }

  consumeString(delimiter) {
    let string = [delimiter];
    while (this.notEnd() && this.advance() != delimiter) {
      string.push(this.current);
    }
    string.push(delimiter);
    return string.join('');
  }

  consumeIdentifier() {
    let identifier = [this.current];
    while (this.notEnd() && isAlpha(this.lookAhead())) {
      this.advance();
      identifier.push(this.current);
    }
    return identifier.join('');
  }


  consumeWhitespaces() {
    while (this.notEnd() && this.lookAhead().match(/[ \t]/)) {
      this.advance();
    }
  }

  consumeComment() {
    let comment = [];
    this.advance();
    while (this.notEnd() && this.lookAhead() != "\n") {
      this.advance();
      comment.push(this.current);
    }
    return comment.join('');
  }

  scan() {
    while (this.notEnd()) {
      this.advance()
      switch (this.current) {
        case ' ':
        case '\t':
          if (this.options.compactWhitespaces) {
            this.consumeWhitespaces();
          }
          this.push(Lexer.WHITESPACE);
          break;
        case '\n':
          this.push(Lexer.NEWLINE);
          break;
        case '{':
          this.push(Lexer.OPEN_BRACE);
          break;
        case '}':
          this.push(Lexer.CLOSE_BRACE)
          break;
        case '(':
          this.push(Lexer.OPEN_PAREN)
          break;
        case ')':
          this.push(Lexer.CLOSE_PAREN);
          break;
        case '/':
          if (this.lookAhead() == '/') {
            this.push(Lexer.comment(this.consumeComment()));
            break;
          } else if (this.lookAhead() == '*')  {
            let comment = [];
            this.advance();
            while (this.notEnd() && this.advance() != "*" && this.lookAhead() != "/") {
              comment.push(this.current);
            }
            this.push({type: 'COMMENT', value: comment});
            break;
          }
        case ';':
          this.push(Lexer.SEMI)
          break;
        case "'":
          this.push(Lexer.string(this.consumeString("'")));
          break;
        case '"':
          this.push(Lexer.string(this.consumeString('"')));
          break;
        case '`':
          this.push(Lexer.string(this.consumeString('`')));
          break;
        default:
          if (isAlpha(this.current)) {
            this.push(Lexer.identifier(this.consumeIdentifier()));
          } else {
            this.push(Lexer.other(this.current));
          }
      }
    }
  }
}
Lexer.WHITESPACE = {type: 'WHITESPACE', value: ' '};
Lexer.NEWLINE = {type: 'NEWLINE', value: '\n' };
Lexer.OPEN_BRACE = {type: 'OPEN_BRACE', value: '{' };
Lexer.CLOSE_BRACE = {type: 'CLOSE_BRACE', value: '}' };
Lexer.OPEN_PAREN = {type: 'OPEN_PAREN', value: '(' };
Lexer.CLOSE_PAREN = {type: 'CLOSE_PAREN', value: ')' };
Lexer.SEMI = {type: 'SEMI', value: ';' };

Lexer.singleValueToken = (type) => (value) => { return {type: type, value: value } };
Lexer.string = Lexer.singleValueToken('STRING')
Lexer.identifier = Lexer.singleValueToken('IDENTIFIER')
Lexer.comment = Lexer.singleValueToken('COMMENT')
Lexer.other = Lexer.singleValueToken('OTHER')

Lexer.whitespaceOrNewline = (token) => token == Lexer.WHITESPACE || token == Lexer.NEWLINE;

function isAlpha(x) {
  return x.match(/[a-zA-Z_]/);
}

function lex(code, options) {
  let lexer = new Lexer(code, options)
  lexer.scan();
  return lexer.tokens
}

function printCode(code) {
  let result = lex(code).map((token) => token.value);
  return result.join('');
}

class PrettyPrinter {
  constructor(code, declarations) {
    this.code = code;
    this.tokens = lex(code.split("\n").map((it)=> it.trimRight()).join("\n"), {compactWhitespaces: true});
    this.index = 0;
    this.resultingTokens = [];
    this.declarations = declarations;
  }

  // =========
  // Traversal
  // =========

  notEnd() {
    return this.index < this.tokens.length;
  }

  advance() {
    this.current = this.tokens[this.index];
    this.index++;
    return this.current;
  }

  lookAhead() {
    return this.tokens[this.index];
  }

  // ==============
  // Input checking
  // ==============

  atWhitespaceOrNewline() {
    return Lexer.whitespaceOrNewline(this.current);
  }

  atDeclaration() {
    return this.declarations.indexOf(this.current.value) > -1;
  }

  // ===============
  // Output handling
  // ===============

  push(token) {
    this.resultingTokens.push(token);
  }

  pushCurrent() {
    this.push(this.current);
  }

  pushWhitespace() {
    this.push(Lexer.WHITESPACE);
  }

  last() {
    return this.resultingTokens[this.resultingTokens.length - 1]
  }

  pop() {
    this.resultingTokens.pop();
  }


  // =========================
  // Pretty Printing Primitives
  // ==========================

  pushNewlineWhenNextIsMissing() {
    if (this.lookAhead() != Lexer.NEWLINE) {
      this.push(Lexer.NEWLINE);
    }
  }

  pushNewlineWhenPreviousIsMissing() {
    let lastToken = this.last();
    if (lastToken && lastToken != Lexer.NEWLINE) {
      this.push(Lexer.NEWLINE);
    }
  }

  popWhitespaceOrNewline() {
    let lastToken = this.last();
    if (lastToken && Lexer.whitespaceOrNewline(lastToken)) {
      this.pop();
    }
  }

  consumeWhitespacesAndNewlines() {
    while (this.notEnd() && Lexer.whitespaceOrNewline(this.lookAhead())) {
      this.advance();
    }
  }

  advanceIgnoringWhitespacesAndNewlines() {
    this.advance();
    if (this.atWhitespaceOrNewline()) {
      this.consumeWhitespacesAndNewlines();
      this.advance();
    }
  }

  prettyPrint() {
    while (this.notEnd()) {
      this.advance();
      switch (this.current.type) {
        case Lexer.NEWLINE.type:
        case Lexer.WHITESPACE.type:
          this.pushCurrent();
          this.consumeWhitespacesAndNewlines();
          break;
        case Lexer.SEMI.type:
          this.pushCurrent();
          this.pushNewlineWhenNextIsMissing();
          break;
        case 'IDENTIFIER':
          if (this.atDeclaration()) {
            // keyword
            this.pushNewlineWhenPreviousIsMissing();
            this.pushCurrent();
            this.advanceIgnoringWhitespacesAndNewlines();

            // whitespace
            this.pushWhitespace();

            // name
            if (this.current.type == 'IDENTIFIER') {
              this.pushCurrent();
              this.advanceIgnoringWhitespacesAndNewlines();
            }

            // (
            this.pushCurrent();
            this.advanceIgnoringWhitespacesAndNewlines();

            // args
            let balance = 1;
            while (balance > 0 && this.notEnd()) {
              if (this.current == Lexer.OPEN_PAREN) {
                balance++;
              } else if (this.current == Lexer.CLOSE_PAREN) {
                balance--;
              }

              if (balance == 0) {
                this.popWhitespaceOrNewline();
              } else {
                this.pushCurrent();
                this.advance();
              }
            }

            // )
            this.pushCurrent();
            this.advanceIgnoringWhitespacesAndNewlines();

            // whitespace
            this.pushWhitespace();

            // {
            this.pushCurrent();
            this.pushNewlineWhenNextIsMissing();
            this.advance();

            console.log(this.current)

            // body
            balance = 1;
            while (balance > 0 && this.notEnd()) {
              if (this.current == Lexer.OPEN_BRACE) {
                balance++;
              } else if (this.current == Lexer.CLOSE_BRACE) {
                balance--;
              }

              if (balance == 0) {
                this.popWhitespaceOrNewline();
              } else {
                this.pushCurrent();
                this.advance();
              }
            }

            // }
            this.push(Lexer.NEWLINE);
            this.pushCurrent();
            this.pushNewlineWhenNextIsMissing();
            break;
          }
        default:
          this.pushCurrent();
      }
    }
    return this.resultingTokens.map((token) => token.value).join('');
  }
}


describe("Lexer", () => {
  function lexes(code, tokens) {
    it(code, () => { assert.deepEqual(lex(code), tokens) });
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
  lexes('foo  bar', [Lexer.identifier("foo"), Lexer.WHITESPACE, Lexer.WHITESPACE, Lexer.identifier("bar")]);
  lexes('foo\nbar\nbaz', [Lexer.identifier("foo"), Lexer.NEWLINE, Lexer.identifier("bar"), Lexer.NEWLINE, Lexer.identifier("baz")]);
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
    assert.equal(code, printCode(code));
   })
 })
})


function format(code) {
  return new PrettyPrinter(code, ['function', 'procedure', 'if', 'repeat']).prettyPrint();
}

describe("format", () => {

  it("foo();bar();baz()", () => { assert.equal(format("foo();bar();baz()"), "foo();\nbar();\nbaz()") });
  it("", () => { assert.equal(format(""), "") });
  it("let x = 1;\n", () => { assert.equal(format("let x = 1;\n"), "let x = 1;\n") });
  it("x\n", () => { assert.equal(format("x\n"), "x\n") });

  describe("ifs", () => {
    it("if (true) {\nconsole.log('ups')\n}\n", () => { assert.equal(format("if (true) {\nconsole.log('ups')\n}\n"), "if (true) {\nconsole.log('ups')\n}\n") });
    it("if(true){\nconsole.log('ups')\n}\n", () => { assert.equal(format("if(true){\nconsole.log('ups')\n}\n"), "if (true) {\nconsole.log('ups')\n}\n") });
  });

  describe("functions", () => {
    it("function foo() {\n}\n", () => { assert.equal(format("function foo() {\n}\n"), "function foo() {\n}\n") });
    it("function foo() {\n}\n\nfunction bar() {\n}\n", () => {
      assert.equal(format("function foo() {\n}\n\nfunction bar() {\n}\n"), "function foo() {\n}\n\nfunction bar() {\n}\n")
    });
    it("function foo() {\n}function bar() {\n}\n", () => {
      assert.equal(format("function foo() {\n}function bar() {\n}\n"), "function foo() {\n}\n\nfunction bar() {\n}\n")
    });

    it("function(x) {\n}\n", () => { assert.equal(format("function(x) {\n}\n"), "function (x) {\n}\n") });
    it("function(x){return 2;}", () => { assert.equal(format("function(x){return 2;}"), "function (x) {\nreturn 2;\n}\n") });
    it("function(x){return 2}", () => { assert.equal(format("function(x){return 2}"), "function (x) {\nreturn 2\n}\n") });

    it("function foo(x) {\n}\n", () => { assert.equal(format("function foo(x) {\n}\n"), "function foo(x) {\n}\n") });
    it(" function foo(x) {\n}\n", () => { assert.equal(format(" function foo(x) {\n}\n"), " \nfunction foo(x) {\n}\n") });
    it("\n\nfunction foo(x) {\n}\n", () => { assert.equal(format("\n\nfunction foo(x) {\n}\n"), "\nfunction foo(x) {\n}\n") });
    it("\n\n  function foo(x) {\n}\n", () => { assert.equal(format("\n\n  function foo(x) {\n}\n"), "\nfunction foo(x) {\n}\n") });
    it("\n \n  function foo(x) {\n}\n", () => { assert.equal(format("\n \n  function foo(x) {\n}\n"), "\nfunction foo(x) {\n}\n") });
    it(" \n \n  function foo(x) {\n}\n", () => { assert.equal(format(" \n \n  function foo(x) {\n}\n"), "\nfunction foo(x) {\n}\n") });

    it("function foo (x) {\n}\n", () => { assert.equal(format("function foo (x) {\n}\n"), "function foo(x) {\n}\n") });
    it("function foo (x, y) {\n}\n", () => { assert.equal(format("function foo (x, y) {\n}\n"), "function foo(x, y) {\n}\n") });
    it("function foo (  x, y ) {\n}\n", () => { assert.equal(format("function foo (  x, y ) {\n}\n"), "function foo(x, y) {\n}\n") });
    it("function foo (x, y) {}\n", () => { assert.equal(format("function foo (x, y) {}\n"), "function foo(x, y) {\n}\n") });
    it("function (x, y) {}\n", () => { assert.equal(format("function (x, y) {}\n"), "function (x, y) {\n}\n") });
  });

  describe("procedures", () => {
    it("procedure Foo(x) {\n}\n", () => { assert.equal(format("procedure Foo(x) {\n}\n"), "procedure Foo(x) {\n}\n") });
    it("procedure Foo (x) {\n}\n", () => { assert.equal(format("procedure Foo (x) {\n}\n"), "procedure Foo(x) {\n}\n") });
    it("procedure Foo (x, y) {\n}\n", () => { assert.equal(format("procedure Foo (x, y) {\n}\n"), "procedure Foo(x, y) {\n}\n") });
    it("procedure Foo (  x, y ) {\n}\n", () => { assert.equal(format("procedure Foo (  x, y ) {\n}\n"), "procedure Foo(x, y) {\n}\n") });
    it("procedure Foo (x, y) {}\n", () => { assert.equal(format("procedure Foo (x, y) {}\n"), "procedure Foo(x, y) {\n}\n") });
  });

  xdescribe("defs", () => {
    it("def foo(x)\nend", () => { assert.equal(format("def foo(x)\nend"), "def foo(x)\nend") });
    it("def foo (x)\nend", () => { assert.equal(format("def foo (x)\nend"), "def foo(x)\nend") });
    it("def foo (x, y)\nend", () => { assert.equal(format("def foo (x, y)\nend"), "def foo(x, y)\nend") });
    it("def foo (  x, y )\nend", () => { assert.equal(format("def foo (  x, y )\nend"), "def foo(x, y)\nend") });
    it("def foo (  x, y )end", () => { assert.equal(format("def foo (  x, y )end"), "def foo(x, y)\nend") });
    it("def foo! (  x, y )end", () => { assert.equal(format("def foo! (  x, y )end"), "def foo!(x, y)\nend") });
    it("def foo? (  x, y )end", () => { assert.equal(format("def foo? (  x, y )end"), "def foo?(x, y)\nend") });
  });
});

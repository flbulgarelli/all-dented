const {lex, Lexer, PrettyPrinter} = require('../src/index');
const assert = require('assert');

function prettyPrint(code) {
  return new PrettyPrinter(code,
    [
      {keyword: 'function'},
      {keyword: 'procedure'},
      {keyword: 'if'},
      {keyword: 'else', trailing: true, headless: true, continuators: ['if']},
      {keyword: 'repeat'}
    ],
    [Lexer.OPEN_BRACE],
    [Lexer.CLOSE_BRACE],
    Lexer.OPEN_BRACE,
    Lexer.CLOSE_BRACE,
  ).prettyPrint();
}

describe("prettyPrint", () => {
  function prints(code, pretty) {
    it(code, () => { assert.deepEqual(prettyPrint(code), pretty) });
  }


  prints(("foo();bar();baz()"), "foo();\nbar();\nbaz()");
  prints((""), "");
  prints(("let x = 1;\n"), "let x = 1;\n");
  prints(("x\n"), "x\n");

  describe("ifs", () => {
    prints(("if (true) {\nconsole.log('ups')\n}\n"), "if (true) {\n  console.log('ups')\n}\n");
    prints(("if(true){\nconsole.log('ups')\n}\n"), "if (true) {\n  console.log('ups')\n}\n");
    prints(("if(true){console.log('ups')}"), "if (true) {\n  console.log('ups')\n}\n");
    prints(("if(true){console.log('ups')}else{console.log('ok')}"), "if (true) {\n  console.log('ups')\n} else {\n  console.log('ok')\n}\n");
    prints(("if(true){console.log('ups')}else if (false) {console.log('ok')}"), "if (true) {\n  console.log('ups')\n} else if (false) {\n  console.log('ok')\n}\n");
    prints(("x = 4\nif(true){console.log('ups')}else if (false) {console.log('ok')}x = 5\nx = 8"), "x = 4\nif (true) {\n  console.log('ups')\n} else if (false) {\n  console.log('ok')\n}\nx = 5\nx = 8");
  });


  describe("functions", () => {
    prints("function foo(){let x = 1;let y = 2;if(true){console.log(y)}}", "function foo() {\n  let x = 1;\n  let y = 2;\n  \n  if (true) {\n    console.log(y)\n  }\n}\n");
    prints("function foo(){let x = 1; let y = 2; if(true){console.log(y)}}", "function foo() {\n  let x = 1;\n  let y = 2;\n  \n  if (true) {\n    console.log(y)\n  }\n}\n");
    prints("function foo(){let x = 1;if(true){console.log(y)}if(false){console.log(z)}}", "function foo() {\n  let x = 1;\n  \n  if (true) {\n    console.log(y)\n  }\n  \n  if (false) {\n    console.log(z)\n  }\n}\n");

    prints("function foo() {\n}\n", "function foo() {\n}\n");
    prints("function foo() {\n}\n\nfunction bar() {\n}\n", "function foo() {\n}\nfunction bar() {\n}\n");
    prints("function foo() {\n}function bar() {\n}\n", "function foo() {\n}\nfunction bar() {\n}\n");

    prints("function(x) {\n}\n", "function (x) {\n}\n");
    prints("function(x){return 2;}", "function (x) {\n  return 2;\n}\n");
    prints("function(x){return 2}", "function (x) {\n  return 2\n}\n");

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

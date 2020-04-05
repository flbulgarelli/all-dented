const assert = require('assert');

function format(it) {
  return it
    .replace(/;\n?/g, `;\n`)
    .replace(/(function|procedure)\s*(\w+)\s*\(\s*([\w\s,\.]*?)\s*\)\s*\{\n?/g, `$1 $2($3) {\n`)
    .replace(/(def)\s*(\w+[!\?]?)\s*\(\s*([\w\s,\.]*?)\s*\)\s*?\n?/g, `$1 $2($3)\n`)
    .replace(/(if)\s*\((.*?)\)\s*?\n?/g, `$1 $2($3)\n`);
}


describe("format", () => {

  it("foo();bar();baz()", () => { assert.equal(format("foo();bar();baz()"), "foo();\nbar();\nbaz()") });
  it("", () => { assert.equal(format(""), "") });
  it("let x = 1;\n", () => { assert.equal(format("let x = 1;\n"), "let x = 1;\n") });
  it("x\n", () => { assert.equal(format("x\n"), "x\n") });

  describe("ifs", () => {
    it("if (true) {\nconsole.log('ups')\n}\n", () => { assert.equal(format("if (true) {\nconsole.log('ups')\n}\n"), "if (true) {\nconsole.log('ups')\n}\n") });
    it("if(true){\nconsole.log('ups')\n}\n", () => { assert.equal(format("if(true){\nconsole.log('ups')\n}\n"), "if(true) {\nconsole.log('ups')\n}\n") });
  });

  describe("functions", () => {
    it("function foo() {\n}\n", () => { assert.equal(format("function foo() {\n}\n"), "function foo() {\n}\n") });
    it("function foo() {\n}\n\nfunction bar() {\n}\n", () => {
      assert.equal(format("function foo() {\n}\n\nfunction bar() {\n}\n"), "function foo() {\n}\n\nfunction bar() {\n}\n")
    });
    it("function foo(x) {\n}\n", () => { assert.equal(format("function foo(x) {\n}\n"), "function foo(x) {\n}\n") });
    it("function foo (x) {\n}\n", () => { assert.equal(format("function foo (x) {\n}\n"), "function foo(x) {\n}\n") });
    it("function foo (x, y) {\n}\n", () => { assert.equal(format("function foo (x, y) {\n}\n"), "function foo(x, y) {\n}\n") });
    it("function foo (  x, y ) {\n}\n", () => { assert.equal(format("function foo (  x, y ) {\n}\n"), "function foo(x, y) {\n}\n") });
    it("function foo (x, y) {}\n", () => { assert.equal(format("function foo (x, y) {}\n"), "function foo(x, y) {\n}\n") });
    it("function (x, y) {}\n", () => { assert.equal(format("function (x, y) {}\n"), "function (x, y) {}\n") });
  });

  describe("procedures", () => {
    it("procedure Foo(x) {\n}\n", () => { assert.equal(format("procedure Foo(x) {\n}\n"), "procedure Foo(x) {\n}\n") });
    it("procedure Foo (x) {\n}\n", () => { assert.equal(format("procedure Foo (x) {\n}\n"), "procedure Foo(x) {\n}\n") });
    it("procedure Foo (x, y) {\n}\n", () => { assert.equal(format("procedure Foo (x, y) {\n}\n"), "procedure Foo(x, y) {\n}\n") });
    it("procedure Foo (  x, y ) {\n}\n", () => { assert.equal(format("procedure Foo (  x, y ) {\n}\n"), "procedure Foo(x, y) {\n}\n") });
    it("procedure Foo (x, y) {}\n", () => { assert.equal(format("procedure Foo (x, y) {}\n"), "procedure Foo(x, y) {\n}\n") });
  });

  describe("defs", () => {
    it("def foo(x)\nend", () => { assert.equal(format("def foo(x)\nend"), "def foo(x)\nend") });
    it("def foo (x)\nend", () => { assert.equal(format("def foo (x)\nend"), "def foo(x)\nend") });
    it("def foo (x, y)\nend", () => { assert.equal(format("def foo (x, y)\nend"), "def foo(x, y)\nend") });
    it("def foo (  x, y )\nend", () => { assert.equal(format("def foo (  x, y )\nend"), "def foo(x, y)\nend") });
    it("def foo (  x, y )end", () => { assert.equal(format("def foo (  x, y )end"), "def foo(x, y)\nend") });
    it("def foo! (  x, y )end", () => { assert.equal(format("def foo! (  x, y )end"), "def foo!(x, y)\nend") });
    it("def foo? (  x, y )end", () => { assert.equal(format("def foo? (  x, y )end"), "def foo?(x, y)\nend") });
  });
});

const {Lexer, lex} = require('./lexer');

class PrettyPrinter {
  constructor(code, declarations) {
    this.code = code;
    this.tokens = lex(code.split("\n").map((it)=> it.trimRight()).join("\n"), {squeeze: true, trim: true});
    this.index = 0;
    this.resultingTokens = [];
    this.keywords = declarations.map((it) => it.keyword);
    this.declarations = {};
    declarations.forEach((declaration) => {
      this.declarations[declaration.keyword] = declaration;
    });
    this.indentationLevel = 0;
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

  nextIs(token) {
    return this.lookAhead() === token;
  }

  // ==============
  // Input checking
  // ==============

  atWhitespaceOrNewline() {
    return Lexer.whitespaceOrNewline(this.current);
  }

  atDeclaration() {
    return this.keywords.indexOf(this.current.value) > -1;
  }

  // ===============
  // Output handling
  // ===============

  push(token) {
    this.resultingTokens.push(token);
  }

  pushCurrent() {
    this.updateIndentationLevel();
    this.push(this.current);
    this.indent();
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

  indent() {
    if (this.current === Lexer.NEWLINE && !this.nextIs(Lexer.NEWLINE) && !this.nextIs(Lexer.CLOSE_BRACE)) {
      for (let i = 0; i < (this.indentationLevel * 2); i++) {
        this.push(Lexer.WHITESPACE);
      }
    }
  }

  updateIndentationLevel() {
    if (this.current === Lexer.OPEN_BRACE) {
      this.indentationLevel++;
    } else if (this.current === Lexer.CLOSE_BRACE) {
      this.indentationLevel--;
    }
  }

  // =========================
  // Pretty Printing Primitives
  // ==========================

  pushNewlineWhenNextIsMissing() {
    if (!this.nextIs(Lexer.NEWLINE)) {
      this.push(Lexer.NEWLINE);
    }
  }

  pushNewlineWhenPreviousIsMissing() {
    let lastToken = this.last();
    if (lastToken && lastToken !== Lexer.NEWLINE) {
      this.push(Lexer.NEWLINE);
    }
  }

  pushWhitespaceWhenPreviousIsMissing() {
    let lastToken = this.last();
    if (lastToken && lastToken !== Lexer.WHITESPACE) {
      this.push(Lexer.WHITESPACE);
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

  // ========
  // Handlers
  // ========

  handleCurrent() {
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
          this.handleDeclaration();
          break;
        }
      default:
        this.pushCurrent();
    }
  }

  handleBalanced(openToken, closeToken, cont) {
    let balance = 1;
    while (balance > 0 && this.notEnd()) {
      if (this.current == openToken) {
        balance++;
      } else if (this.current == closeToken) {
        balance--;
      }

      if (balance == 0) {
        this.popWhitespaceOrNewline();
      } else {
        cont();
        this.advance();
      }
    }
  }

  handleArgs() {
    // (
    this.pushCurrent();
    this.advanceIgnoringWhitespacesAndNewlines();

    // args?
    this.handleBalanced(Lexer.OPEN_PAREN, Lexer.CLOSE_PAREN, () => this.pushCurrent());

    // )
    this.pushCurrent();
    this.advanceIgnoringWhitespacesAndNewlines();
    this.pushWhitespace();
  }

  handleBody() {
    // {
    this.pushCurrent();
    this.pushNewlineWhenNextIsMissing();
    this.advance();

    // body?
    this.handleBalanced(Lexer.OPEN_BRACE, Lexer.CLOSE_BRACE, () => this.handleCurrent());

    // }
    this.pushNewlineWhenPreviousIsMissing();
    this.pushCurrent();
    this.pushNewlineWhenNextIsMissing();
  }

  handleDeclaration() {
    let currentDeclaration = this.declarations[this.current.value];

    if (currentDeclaration.trailing) {
      this.popWhitespaceOrNewline();
      this.pushWhitespaceWhenPreviousIsMissing();
    } else {
      this.pushNewlineWhenPreviousIsMissing();
    }
    this.pushCurrent();
    this.advanceIgnoringWhitespacesAndNewlines();
    this.pushWhitespace();

    if (this.current.type == 'IDENTIFIER') {
      this.pushCurrent();
      this.advanceIgnoringWhitespacesAndNewlines();
    }

    if (this.current == Lexer.OPEN_PAREN) {
      this.handleArgs();
    }

    if (this.current == Lexer.OPEN_BRACE) {
      this.handleBody();
    }
  }

  prettyPrint() {
    while (this.notEnd()) {
      this.advance();
      this.handleCurrent();
    }
    return this.resultingTokens.map((token) => token.value).join('');
  }
}

module.exports = {
  PrettyPrinter: PrettyPrinter
}

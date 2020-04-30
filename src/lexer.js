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

  nextIs(char) {
    return this.lookAhead() === char;
  }

  consumeString(delimiter) {
    let string = [delimiter];
    while (this.notEnd() && this.advance() !== delimiter) {
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
    while (this.notEnd() && !this.nextIs("\n")) {
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
          if (this.options.squeeze) {
            this.consumeWhitespaces();
          }
          if (!this.options.squeeze || !this.nextIs("\n")) {
            this.push(Lexer.WHITESPACE);
          }
          break;
        case '\n':
          if (this.options.trim) {
            this.consumeWhitespaces();
          }
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
          if (this.nextIs('/')) {
            this.push(Lexer.comment(this.consumeComment()));
            break;
          } else if (this.nextIs('*'))  {
            let comment = [];
            this.advance();
            while (this.notEnd() && this.advance() !== "*" && !this.nextIs("/")) {
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

module.exports = {
  Lexer: Lexer,
  lex: lex
}

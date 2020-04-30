const lexer = require('./lexer')
const prettyPrinter = require('./pretty-printer')

module.exports = {
  lex: lexer.lex,
  Lexer: lexer.Lexer,
  prettyPrint: prettyPrinter.prettyPrint,
  PrettyPrinter: prettyPrinter.PrettyPrinter,
};

import { ParserBuilder, ParenthesesParselet } from "./parse"
import { Tokenizer } from "./tokenize"

const { tokenize } = new Tokenizer([
  { pattern: "+" },
  { pattern: "-" },
  { pattern: "*" },
  { pattern: "/" },
  { pattern: "^" },
  { pattern: "(" },
  { pattern: ")" },
  { pattern: /\d+/, name: "NUMBER" }
])

const enum Precedence {
  AddSub = 1,
  MulDiv = 2,
  Exp = 3,
  Negate = 4
}

const calculator = new ParserBuilder<number>()
  .registerPrefix("NUMBER", { parse: (_, token) => +token.match })
  .registerPrefix("(", ParenthesesParselet)
  .registerPrefix("-", { parse: parser => -parser.parse(Precedence.Negate) })

  .infixRight("^", Precedence.Exp, (left, _, right) => left ** right)

  .infixLeft("/", Precedence.MulDiv, (left, _, right) => left / right)
  .infixLeft("*", Precedence.MulDiv, (left, _, right) => left * right)
  .infixLeft("+", Precedence.AddSub, (left, _, right) => left + right)
  .infixLeft("-", Precedence.AddSub, (left, _, right) => left - right)

  .construct()

export const calculate = (string: string) => calculator(tokenize(string))

import { ParserBuilder, ParenthesesParselet } from "./parse"
import { Tokenizer } from "./tokenize"

const tokenizer = new Tokenizer([
  { pattern: "+" },
  { pattern: "-" },
  { pattern: "*" },
  { pattern: "/" },
  { pattern: "^" },
  { pattern: "(" },
  { pattern: ")" },
  { pattern: "!" },
  { pattern: /\d+/, name: "NUMBER" }
])

const enum Precedence {
  AddSub = 1,
  MulDiv = 2,
  Exp = 3,
  Negate = 4
}

describe("ParserBuilder", () => {
  it("can build a arithmetic parser with correct order of operations", () => {
    let parse = new ParserBuilder<number>()
      .registerPrefix("NUMBER", { parse: (_, token) => +token.match })
      .infixRight("^", Precedence.Exp, (left, _, right) => left ** right)
      .infixLeft("/", Precedence.MulDiv, (left, _, right) => left / right)
      .infixLeft("*", Precedence.MulDiv, (left, _, right) => left * right)
      .infixLeft("+", Precedence.AddSub, (left, _, right) => left + right)
      .infixLeft("-", Precedence.AddSub, (left, _, right) => left - right)
      .construct()

    let tokens = tokenizer.tokenize("3 / 3 + 4 * 3 ^ 2 - 1")
    let result = parse(tokens)
    expect(result).toBe(36)
  })

  it("can build a arithmetic parser with parentheses", () => {
    let parse = new ParserBuilder<number>()
      .registerPrefix("NUMBER", { parse: (_, token) => +token.match })
      .registerPrefix("(", ParenthesesParselet)
      .infixRight("^", Precedence.Exp, (left, _, right) => left ** right)
      .infixLeft("/", Precedence.MulDiv, (left, _, right) => left / right)
      .infixLeft("*", Precedence.MulDiv, (left, _, right) => left * right)
      .infixLeft("+", Precedence.AddSub, (left, _, right) => left + right)
      .infixLeft("-", Precedence.AddSub, (left, _, right) => left - right)
      .construct()

    let tokens = tokenizer.tokenize("3 / 3 + 4 * (3 ^ (2 - 1))")
    let result = parse(tokens)
    expect(result).toBe(13)
  })

  it("can build a arithmetic parser with correct associativity", () => {
    let parse = new ParserBuilder<number>()
      .registerPrefix("NUMBER", { parse: (_, token) => +token.match })
      .infixRight("^", Precedence.Exp, (left, _, right) => left ** right)
      .infixLeft("-", Precedence.AddSub, (left, _, right) => left - right)
      .infixLeft("+", Precedence.AddSub, (left, _, right) => left + right)
      .construct()

    let tokens = tokenizer.tokenize("5 - 4 - 3 - 2 - 1 + 2 ^ 3 ^ 2")
    let result = parse(tokens)
    expect(result).toBe(507)
  })

  it("can build an arithmetic parser with prefix operators", () => {
    let parse = new ParserBuilder<number>()
      .registerPrefix("NUMBER", { parse: (_, token) => +token.match })
      .registerPrefix("(", ParenthesesParselet)
      .registerPrefix("-", { parse: parser => -parser.parse(Precedence.Negate) })
      .infixLeft("-", Precedence.AddSub, (left, _, right) => left - right)
      .infixLeft("+", Precedence.AddSub, (left, _, right) => left + right)
      .construct()

    let tokens = tokenizer.tokenize("-4 + -(4 + 5 - -4)")
    let result = parse(tokens)
    expect(result).toBe(-17)
  })

  it("can build an arithmetic parser with postfix operators", () => {
    let parse = new ParserBuilder<number>()
      .registerPrefix("NUMBER", { parse: (_, token) => +token.match })
      .registerPrefix("(", ParenthesesParselet)
      .postfix("!", Precedence.Negate, left => -left)
      .infixLeft("-", Precedence.AddSub, (left, _, right) => left - right)
      .infixLeft("+", Precedence.AddSub, (left, _, right) => left + right)
      .construct()

    let tokens = tokenizer.tokenize("4! + (4 + 5 - 4!)!")
    let result = parse(tokens)
    expect(result).toBe(-17)
  })
})

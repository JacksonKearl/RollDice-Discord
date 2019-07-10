import { ParserBuilder, ParenthesesParselet } from "./parse"
import { Tokenizer } from "./tokenize"
import {
  Name,
  Number,
  Roll,
  Add,
  Sub,
  Mul,
  Advantage,
  DiceExpression,
  Neg,
  Div,
  Disadvantage,
  Bang,
  Assign,
  ExpressionResult
} from "./dice-expression"
import { UserEnvironmentView } from "./environment"

export const { tokenize } = new Tokenizer([
  { pattern: "+=" },
  { pattern: "-=" },
  { pattern: "+" },
  { pattern: "-" },
  { pattern: "*" },
  { pattern: "/" },
  { pattern: "(" },
  { pattern: ")" },
  { pattern: "!" },
  { pattern: "=" },
  { pattern: /@\s*a(d(v(a(n(t(a(g(e)?)?)?)?)?)?)?)?\b/, name: "ADVANTAGE" },
  { pattern: /@\s*d(i(s(a(d(v(a(n(t(a(g(e)?)?)?)?)?)?)?)?)?)?)?\b/, name: "DISADVANTAGE" },
  { pattern: /(\d+)?(?:d|D)(\d+)(k\d+)?/, name: "ROLL" },
  { pattern: /[a-zA-Z](\w|\.)*/, name: "NAME" },
  { pattern: /\d+/, name: "NUMBER" }
])

const enum Precedence {
  Assign = 1,
  At = 2,
  AddSub = 3,
  MulDiv = 4,
  Bang = 5,
  Negate = 6
}

export const calculator = (env: UserEnvironmentView) =>
  new ParserBuilder<DiceExpression>()
    .registerPrefix("NUMBER", { parse: (_, token) => new Number(token.match) })
    .registerPrefix("ROLL", { parse: (_, token) => new Roll(token.match) })
    .registerPrefix("NAME", { parse: (_, token) => new Name(token.match, execute, env) })
    .registerPrefix("(", ParenthesesParselet)

    .prefix("-", Precedence.Negate, (_, right) => Neg(right))

    .postfix("!", Precedence.Bang, left => Bang(left))

    .postfix("ADVANTAGE", Precedence.At, left => Advantage(left))
    .postfix("DISADVANTAGE", Precedence.At, left => Disadvantage(left))

    .infixLeft("/", Precedence.MulDiv, (left, _, right) => Div(left, right))
    .infixLeft("*", Precedence.MulDiv, (left, _, right) => Mul(left, right))
    .infixLeft("+", Precedence.AddSub, (left, _, right) => Add(left, right))
    .infixLeft("-", Precedence.AddSub, (left, _, right) => Sub(left, right))

    .infixLeft("+=", Precedence.Assign, (left, _, right) =>
      Assign(left, Add(Bang(left), right), env)
    )
    .infixLeft("-=", Precedence.Assign, (left, _, right) =>
      Assign(left, Sub(Bang(left), right), env)
    )
    .infixLeft("=", Precedence.Assign, (left, _, right) => Assign(left, right, env))

    .construct()

export const execute: (command: string, env: UserEnvironmentView) => ExpressionResult = (
  str,
  env
) => calculator(env)(tokenize(str)).execute()

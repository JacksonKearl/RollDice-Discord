import { ParserBuilder, PARENTHESES_PARSELET, Tokenizer, TokenMatchResult } from "@jkearl/pratt"

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
  { pattern: /@\s*a(d(v(a(n(t(a(g(e)?)?)?)?)?)?)?)?\b/, id: "ADVANTAGE" },
  { pattern: /@\s*d(i(s(a(d(v(a(n(t(a(g(e)?)?)?)?)?)?)?)?)?)?)?\b/, id: "DISADVANTAGE" },
  { pattern: /(\d+)?(?:d|D)(\d+)(k\d+)?/, id: "ROLL" },
  { pattern: /[a-zA-Z](\w|\.)*/, id: "NAME" },
  { pattern: /\d+/, id: "NUMBER" }
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
  new ParserBuilder<DiceExpression, TokenMatchResult>(tokenize)
    .registerPrefix("NUMBER", { parse: (_, token) => new Number(token.value) })
    .registerPrefix("ROLL", { parse: (_, token) => new Roll(token.value) })
    .registerPrefix("NAME", { parse: (_, token) => new Name(token.value, execute, env) })
    .registerPrefix("(", PARENTHESES_PARSELET)

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
) => calculator(env)(str).execute()

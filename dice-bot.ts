import { ParserBuilder, ParenthesesParselet, Parser } from "./parse"
import { Tokenizer } from "./tokenize"

export const Environment: Record<string, string> = {}

const { tokenize } = new Tokenizer([
  { pattern: "+" },
  { pattern: "-" },
  { pattern: "*" },
  { pattern: "/" },
  { pattern: "(" },
  { pattern: ")" },
  { pattern: "!" },
  { pattern: "=" },
  { pattern: /@a(d(v(a(n(t(a(g(e)?)?)?)?)?)?)?)?\b/, name: "ADVANTAGE" },
  { pattern: /@d(i(s(a(d(v(a(n(t(a(g(e)?)?)?)?)?)?)?)?)?)?)?\b/, name: "DISADVANTAGE" },
  { pattern: /(\d+)?d(\d+)(k\d+)?/, name: "ROLL" },
  { pattern: /\d+/, name: "NUMBER" },
  { pattern: /(\w|\.)+/, name: "NAME" }
])

const enum Precedence {
  Assign = 1,
  At = 2,
  AddSub = 3,
  MulDiv = 4,
  Bang = 5,
  Negate = 6
}

const calculator = new ParserBuilder<DiceExpression>()
  .registerPrefix("NUMBER", { parse: (_, token) => new Number(token.match) })
  .registerPrefix("ROLL", { parse: (_, token) => new Roll(token.match) })
  .registerPrefix("NAME", { parse: (_, token) => new Name(token.match) })
  .registerPrefix("(", ParenthesesParselet)

  .prefix("-", Precedence.Negate, (_, right) => Neg(right))

  .postfix("!", Precedence.Bang, left => Bang(left))

  .postfix("ADVANTAGE", Precedence.At, left => Advantage(left))
  .postfix("DISADVANTAGE", Precedence.At, left => Disadvantage(left))

  .infixLeft("/", Precedence.MulDiv, (left, _, right) => Div(left, right))
  .infixLeft("*", Precedence.MulDiv, (left, _, right) => Mul(left, right))
  .infixLeft("+", Precedence.AddSub, (left, _, right) => Add(left, right))
  .infixLeft("-", Precedence.AddSub, (left, _, right) => Sub(left, right))

  .infixLeft("=", Precedence.Assign, (left, _, right) => Assign(left, right))

  .construct()

export const calculate: (command: string) => DiceExpression = str => calculator(tokenize(str))

interface DiceExpression {
  execute(): { value: number; messages: string[]; trace: string }
}

class Number implements DiceExpression {
  constructor(private num: string) {}
  execute() {
    return {
      value: parseInt(this.num, 10),
      trace: this.num,
      messages: []
    }
  }
}

class Roll implements DiceExpression {
  private numDice: number
  private numSides: number
  private numKeep: number

  constructor(private rollString: string) {
    const [numDice, numSides, numKeep] = rollString.match(/(\d+)?d(\d+)(?:k(\d+))?/)!
    this.numDice = +numDice || 1
    this.numSides = +numSides
    this.numKeep = +numKeep || +numDice
  }

  execute() {
    const rolls = Array.from({ length: this.numDice })
      .map(() => Math.floor(Math.random() * this.numSides + 1))
      .sort((a, b) => b - a)

    const keptRolls = rolls.slice(0, this.numKeep)
    const discardedRolls = rolls.slice(this.numKeep)

    return {
      value: keptRolls.reduce((a, b) => a + b),
      trace: this.rollString,
      messages: [
        discardedRolls.length
          ? `${this.rollString}: [${keptRolls},~~${discardedRolls}~~]`
          : `${this.rollString}: [${keptRolls}]`,
        ...(keptRolls.length === 1 && this.numSides === 20 && keptRolls[0] === 20
          ? ["Natty!! 🍾🍾"]
          : []),
        ...(keptRolls.length === 1 && this.numSides === 20 && keptRolls[0] === 1
          ? ["Natty... 😔"]
          : []),
        ...(this.numKeep > this.numSides
          ? [`Warning: keeping more dice than were rolled. Ignoring keep. (in ${this.rollString})`]
          : [])
      ]
    }
  }
}

class Name implements DiceExpression {
  constructor(public name: string) {}

  execute() {
    const trace = Environment[this.name]
    const exp = calculate(trace)
    const result = exp.execute()
    return {
      value: result.value,
      messages: [`${this.name} -> ${trace}`, ...result.messages],
      trace: this.name
    }
  }
}

const makeInfixOperator = (
  combineValues: (lhs: number, rhs: number) => number,
  combineTraces: (lhs: string, rhs: string) => string
) => (lhs: DiceExpression, rhs: DiceExpression): DiceExpression => ({
  execute() {
    const left = lhs.execute()
    const right = rhs.execute()
    return {
      value: combineValues(left.value, right.value),
      messages: [...left.messages, ...right.messages],
      trace: combineTraces(left.trace, right.trace)
    }
  }
})

const Add = makeInfixOperator((l, r) => l + r, (l, r) => `(${l} + ${r})`)
const Sub = makeInfixOperator((l, r) => l - r, (l, r) => `(${l} - ${r})`)
const Mul = makeInfixOperator((l, r) => l * r, (l, r) => `(${l} * ${r})`)
const Div = makeInfixOperator((l, r) => Math.floor(l / r), (l, r) => `(${l} / ${r})`)

const Neg = (val: DiceExpression): DiceExpression => ({
  execute() {
    const result = val.execute()
    return {
      value: -result.value,
      messages: [...result.messages],
      trace: `-${result.trace}`
    }
  }
})

const Bang = (val: DiceExpression): DiceExpression => ({
  execute() {
    const result = val.execute()
    return {
      value: result.value,
      messages: [...result.messages],
      trace: `${result.value}`
    }
  }
})

const Assign = (name: DiceExpression, value: DiceExpression): DiceExpression => ({
  execute() {
    const result = value.execute()
    if (!(name instanceof Name)) {
      throw Error(`Cannot assign to non-name "${result.trace}"`)
    }
    Environment[name.name] = result.trace
    return {
      value: result.value,
      messages: result.messages,
      trace: `${name} = ${result.trace}`
    }
  }
})

const Advantage = (command: DiceExpression): DiceExpression => ({
  execute() {
    const first = command.execute()
    const second = command.execute()
    const take = first.value > second.value ? first : second
    const other = first.value < second.value ? first : second
    return {
      value: take.value,
      trace: take.trace,
      messages: [
        ...take.messages,
        ...other.messages.map(message => `~~${message.replace(/~~/g, "")}~~`)
      ]
    }
  }
})

const Disadvantage = (command: DiceExpression): DiceExpression => ({
  execute() {
    const first = command.execute()
    const second = command.execute()
    const take = first.value < second.value ? first : second
    const other = first.value > second.value ? first : second
    return {
      value: take.value,
      trace: take.trace,
      messages: [
        ...take.messages,
        ...other.messages.map(message => `~~${message.replace(/~~/g, "")}~~`)
      ]
    }
  }
})

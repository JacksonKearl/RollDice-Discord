import { UserEnvironmentView } from "./environment"

export enum MessageType {
  RollResult,
  NameLookup,
  BangResult
}
export type Message = { type: MessageType; message: string }
export type ExpressionResult = { value: number; messages: Message[]; trace: string }

export interface DiceExpression {
  execute(): ExpressionResult
}

export class Number implements DiceExpression {
  constructor(private num: string) {}
  execute() {
    return {
      value: parseInt(this.num, 10),
      trace: this.num,
      messages: []
    }
  }
}

export class Roll implements DiceExpression {
  private numDice: number
  private numSides: number
  private numKeep: number

  constructor(private rollString: string) {
    const [_, numDice, numSides, numKeep] = rollString.match(/(\d+)?d(\d+)(?:k(\d+))?/i)!
    this.numDice = +numDice || 1
    this.numSides = +numSides
    this.numKeep = +numKeep || this.numDice
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
          ? `${this.rollString} → [${keptRolls},~~${discardedRolls}~~]`
          : `${this.rollString} → [${keptRolls}]`,
        ...(keptRolls.length === 1 && this.numSides === 20 && keptRolls[0] === 20
          ? ["Natty!! 🍾🍾"]
          : []),
        ...(keptRolls.length === 1 && this.numSides === 20 && keptRolls[0] === 1
          ? ["Natty... 😔"]
          : []),
        ...(this.numKeep > this.numDice
          ? [`Warning: keeping more dice than were rolled. Ignoring keep. (in ${this.rollString})`]
          : [])
      ].map(message => ({ type: MessageType.RollResult, message }))
    }
  }
}

export class Name implements DiceExpression {
  constructor(
    public name: string,
    private calculate: (command: string, env: UserEnvironmentView) => ExpressionResult,
    private env: UserEnvironmentView
  ) {}

  execute() {
    const trace = this.env.get(this.name)
    const result = this.calculate(trace, this.env)
    return {
      value: result.value,
      messages: [
        { message: `${this.name} → ${trace}`, type: MessageType.NameLookup },
        ...result.messages
      ],
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

export const Add = makeInfixOperator((l, r) => l + r, (l, r) => `(${l} + ${r})`)
export const Sub = makeInfixOperator((l, r) => l - r, (l, r) => `(${l} - ${r})`)
export const Mul = makeInfixOperator((l, r) => l * r, (l, r) => `(${l} * ${r})`)
export const Div = makeInfixOperator((l, r) => Math.floor(l / r), (l, r) => `(${l} / ${r})`)

export const Neg = (val: DiceExpression): DiceExpression => ({
  execute() {
    const result = val.execute()
    return {
      value: -result.value,
      messages: result.messages,
      trace: `-${result.trace}`
    }
  }
})

export const Bang = (val: DiceExpression): DiceExpression => ({
  execute() {
    const result = val.execute()
    return {
      value: result.value,
      messages: result.messages.map(({ message }) => ({ message, type: MessageType.BangResult })),
      trace: `${result.value}`
    }
  }
})

export const Assign = (
  name: DiceExpression,
  value: DiceExpression,
  env: UserEnvironmentView
): DiceExpression => ({
  execute() {
    const result = value.execute()
    if (!(name instanceof Name)) {
      throw Error(`Cannot assign to non-name "${result.trace}"`)
    }
    env.set(name.name, result.trace)
    return {
      value: `Assigned '${name.name}'` as any,
      messages: result.messages.filter(message => message.type !== MessageType.RollResult),
      trace: `${name.name} = ${result.trace}`
    }
  }
})

export const Advantage = (command: DiceExpression): DiceExpression => ({
  execute() {
    const first = command.execute()
    const second = command.execute()
    const take = first.value > second.value ? first : second
    const other = first.value < second.value ? first : second
    return {
      value: take.value,
      trace: `(${take.trace}) @advantage`,
      messages: [
        ...take.messages,
        ...other.messages.map(({ message, type }) => ({
          message: `~~${message.replace(/~~/g, "")}~~`,
          type
        }))
      ]
    }
  }
})

export const Disadvantage = (command: DiceExpression): DiceExpression => ({
  execute() {
    const first = command.execute()
    const second = command.execute()
    const take = first.value < second.value ? first : second
    const other = first.value > second.value ? first : second
    return {
      value: take.value,
      trace: `(${take.trace}) @disadvantage`,
      messages: [
        ...take.messages,
        ...other.messages.map(({ message, type }) => ({
          message: `~~${message.replace(/~~/g, "")}~~`,
          type
        }))
      ]
    }
  }
})

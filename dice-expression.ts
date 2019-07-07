export type ExpressionResult = { value: number; messages: string[]; trace: string }

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
    const [_, numDice, numSides, numKeep] = rollString.match(/(\d+)?d(\d+)(?:k(\d+))?/)!
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
          ? `${this.rollString}: [${keptRolls},~~${discardedRolls}~~]`
          : `${this.rollString}: [${keptRolls}]`,
        ...(keptRolls.length === 1 && this.numSides === 20 && keptRolls[0] === 20
          ? ["Natty!! 🍾🍾"]
          : []),
        ...(keptRolls.length === 1 && this.numSides === 20 && keptRolls[0] === 1
          ? ["Natty... 😔"]
          : []),
        ...(this.numKeep > this.numDice
          ? [`Warning: keeping more dice than were rolled. Ignoring keep. (in ${this.rollString})`]
          : [])
      ]
    }
  }
}

export class Name implements DiceExpression {
  constructor(
    public name: string,
    private calculate: (command: string, env: Record<string, string>) => ExpressionResult,
    private env: Record<string, string>
  ) {}

  execute() {
    const trace = this.env[this.name]
    if (!trace) throw new Error(`Error: "${this.name}" is not defined.`)
    const result = this.calculate(trace, this.env)
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

export const Add = makeInfixOperator((l, r) => l + r, (l, r) => `(${l} + ${r})`)
export const Sub = makeInfixOperator((l, r) => l - r, (l, r) => `(${l} - ${r})`)
export const Mul = makeInfixOperator((l, r) => l * r, (l, r) => `(${l} * ${r})`)
export const Div = makeInfixOperator((l, r) => Math.floor(l / r), (l, r) => `(${l} / ${r})`)

export const Neg = (val: DiceExpression): DiceExpression => ({
  execute() {
    const result = val.execute()
    return {
      value: -result.value,
      messages: [...result.messages],
      trace: `-${result.trace}`
    }
  }
})

export const Bang = (val: DiceExpression): DiceExpression => ({
  execute() {
    const result = val.execute()
    return {
      value: result.value,
      messages: [...result.messages],
      trace: `${result.value}`
    }
  }
})

export const Assign = (
  name: DiceExpression,
  value: DiceExpression,
  env: Record<string, string>
): DiceExpression => ({
  execute() {
    const result = value.execute()
    if (!(name instanceof Name)) {
      throw Error(`Cannot assign to non-name "${result.trace}"`)
    }
    env[name.name] = result.trace
    return {
      value: result.value,
      messages: result.messages,
      trace: `${name} = ${result.trace}`
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
      trace: take.trace,
      messages: [
        ...take.messages,
        ...other.messages.map(message => `~~${message.replace(/~~/g, "")}~~`)
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
      trace: take.trace,
      messages: [
        ...take.messages,
        ...other.messages.map(message => `~~${message.replace(/~~/g, "")}~~`)
      ]
    }
  }
})

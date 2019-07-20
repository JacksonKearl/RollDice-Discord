import * as DiceBot from "./dice-bot"
import { Environment } from "./environment"

const env = new Environment("{}")
const userenv = env.forUser("foo")

describe("DiceBot", () => {
  describe("Tokenization", () => {
    it("can tokenize dice rolls", () => {
      let executor = DiceBot.calculator(userenv)("d20")
      expect(executor).toMatchSnapshot()
    })

    it("can understand assignment", () => {
      let executor = DiceBot.calculator(userenv)("a = 4").execute()
      expect(executor).toMatchSnapshot()
    })
  })
})

import * as DiceBot from "./dice-bot"
import { Environment } from "./environment"

const env = new Environment("")
const userenv = env.forUser("foo")

describe("DiceBot", () => {
  describe("Tokenization", () => {
    it("can tokenize dice rolls", () => {
      let tokens = DiceBot.tokenize("d20")
      let executor = DiceBot.calculator(userenv)(tokens)
      expect(executor).toMatchSnapshot()
    })

    it("can tokenize dice rolls", () => {
      let tokens = DiceBot.tokenize("a = 4")
      expect(tokens).toMatchSnapshot()
      let executor = DiceBot.calculator(userenv)(tokens)
      expect(executor).toMatchSnapshot()
    })
  })
})

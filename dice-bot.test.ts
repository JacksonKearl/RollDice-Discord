import * as DiceBot from "./dice-bot"

describe("DiceBot", () => {
  describe("Tokenization", () => {
    it("can tokenize dice rolls", () => {
      let tokens = DiceBot.tokenize("d20")
      let executor = DiceBot.calculator({})(tokens)
      expect(executor).toMatchSnapshot()
    })
  })
})

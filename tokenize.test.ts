import { Tokenizer } from "./tokenize"
import * as assert from "assert"

describe("Tokenizer", () => {
  it("can tokenize with simple string matching", () => {
    const { tokenize } = new Tokenizer([
      { pattern: "*" },
      { pattern: "/" },
      { pattern: "+" },
      { pattern: "-" },
      { pattern: "(" },
      { pattern: ")" }
    ])

    const matches = tokenize("  ( + ) / ( * )   -   (  +     )   ")
    expect(matches).toMatchSnapshot()
    expect(matches.length).toBe(11)
    expect(matches[0].match).toBe("(")
    expect(matches[0].name).toBe("(")
  })

  it("can tokenize with regular expression matching", () => {
    const tokenizer = new Tokenizer([
      { pattern: /\/\/.*$/, name: "Comment" },
      { pattern: "+" },
      { pattern: "-" },
      { pattern: /\w+/, name: "Name" }
    ])

    const matches = tokenizer.tokenize("bc + dsf - fasdas // the comment + - dasdas")

    expect(matches).toMatchSnapshot()

    expect(matches.length).toBe(6)
    expect(matches[0].name).toBe("Name")
    expect(matches[0].match).toBe("bc")
    expect(matches[5].name).toBe("Comment")
    expect(matches[5].match).toBe("// the comment + - dasdas")
  })
})

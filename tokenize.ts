export type TokenMatcher =
  | { pattern: string }
  | {
      pattern: string | RegExp
      name: string
    }

interface NormalizedTokenMatcher {
  pattern: RegExp
  name: string
}

export interface TokenMatchResult extends NormalizedTokenMatcher {
  match: string
}

const matchOperators = /[|\\{}()[\]^$+*?.-]/g
const selectInner = /^\/(.*)\/.*$/
const asRegexString = (str: string | RegExp) =>
  typeof str === "string"
    ? str.replace(matchOperators, "\\$&")
    : str.toString().match(selectInner)![1]

export class Tokenizer {
  private matchers: NormalizedTokenMatcher[]
  private matchAll: RegExp

  constructor(matchers: TokenMatcher[]) {
    this.matchers = matchers.map(matcher => ({
      pattern: new RegExp(asRegexString(matcher.pattern)),
      name: "name" in matcher ? matcher.name : matcher.pattern
    }))
    this.matchAll = new RegExp(
      matchers.map(matcher => asRegexString(matcher.pattern)).join("|"),
      "g"
    )

    this.tokenize = this.tokenize.bind(this)
  }

  tokenize(str: string): TokenMatchResult[] {
    let tokens = str.match(this.matchAll)
    if (!tokens) throw new Error("Could not tokenize")
    return tokens.map(match => ({
      ...this.matchers.find(matcher => matcher.pattern.test(match))!,
      match
    }))
  }
}

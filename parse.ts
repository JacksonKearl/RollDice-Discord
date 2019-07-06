import { TokenMatchResult } from "./tokenize"

export interface PrefixParselet<E> {
  parse(parser: Parser<E>, token: TokenMatchResult): E
}

export interface InfixParselet<E> {
  parse(parser: Parser<E>, left: E, token: TokenMatchResult): E
  precedence: number
}

export const ParenthesesParselet: PrefixParselet<any> = {
  parse(parser) {
    const expr = parser.parse()
    if (!parser.match(")")) throw new Error("Parse error: expected `)`")
    return expr
  }
}

export class ParserBuilder<E> {
  private prefixParselets: Record<string, PrefixParselet<E>> = {}
  private infixParselets: Record<string, InfixParselet<E>> = {}
  constructor() {}

  public registerInfix(tokenType: string, parselet: InfixParselet<E>) {
    this.infixParselets[tokenType] = parselet
    return this
  }

  public registerPrefix(tokenType: string, parselet: PrefixParselet<E>) {
    this.prefixParselets[tokenType] = parselet
    return this
  }

  public prefix(
    tokenType: string,
    precedence: number,
    builder: (token: TokenMatchResult, right: E) => E
  ) {
    this.prefixParselets[tokenType] = {
      parse(parser, token) {
        const right = parser.parse(precedence)
        return builder(token, right)
      }
    }
    return this
  }
  public postfix(
    tokenType: string,
    precedence: number,
    builder: (left: E, token: TokenMatchResult) => E
  ) {
    this.infixParselets[tokenType] = {
      parse(parser, left, token) {
        return builder(left, token)
      },
      precedence
    }
    return this
  }
  public infixLeft(
    tokenType: string,
    precedence: number,
    builder: (left: E, token: TokenMatchResult, right: E) => E
  ) {
    this.infixParselets[tokenType] = {
      parse(parser, left, token) {
        const right = parser.parse(precedence)
        return builder(left, token, right)
      },
      precedence
    }
    return this
  }
  public infixRight(
    tokenType: string,
    precedence: number,
    builder: (left: E, token: TokenMatchResult, right: E) => E
  ) {
    this.infixParselets[tokenType] = {
      parse(parser, left, token) {
        const right = parser.parse(precedence - 0.1)
        return builder(left, token, right)
      },
      precedence
    }
    return this
  }

  public construct() {
    return (tokens: TokenMatchResult[]) =>
      new Parser(tokens, this.prefixParselets, this.infixParselets).parse()
  }
}

export class Parser<E> {
  constructor(
    private tokens: TokenMatchResult[],
    private prefixParselets: Record<string, PrefixParselet<E>>,
    private infixParselets: Record<string, InfixParselet<E>>
  ) {}

  public match(expected: string) {
    const token = this.look()
    if (token.name != expected) {
      return false
    }

    this.consume()
    return true
  }

  private getPrecedence(): number {
    const nextToken = this.look()
    if (!nextToken) return 0
    const parser = this.infixParselets[nextToken.name]
    if (parser) return parser.precedence
    else return 0
  }

  private consume() {
    if (!this.tokens.length) {
      throw Error("Cant consume any more tokens.")
    }
    return this.tokens.shift()!
  }

  private look() {
    return this.tokens[0]
  }

  parse(precedence = 0) {
    const token = this.consume()
    const prefix = this.prefixParselets[token.name]
    if (!prefix) {
      throw Error(`Parse error at ${token.match}. No matching prefix parselet.`)
    }

    let left = prefix.parse(this, token)

    while (precedence < this.getPrecedence()) {
      const token = this.consume()
      const infix = this.infixParselets[token.name]
      left = infix.parse(this, left, token)
    }

    return left
  }
}

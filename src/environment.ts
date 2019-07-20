export interface UserEnvironmentView {
  get(key: string): string
  set(key: string, value: string): void
}

export class Environment {
  private env: Record<string, Record<string, string>>
  public modified = false

  constructor(serialized: string) {
    this.env = JSON.parse(serialized) || {}
    this.env.globals = this.env.globals || {}
  }

  public forUser(user: string): UserEnvironmentView {
    return {
      get: (key: string) => {
        const value = (this.env[user] && this.env[user][key]) || this.env.globals[key]
        if (!value) throw new Error(`name '${key}' is not defined.`)
        return value
      },
      set: (key: string, value: string) => {
        this.env[user] = { ...this.env[user], [key]: value }
        this.modified = true
      }
    }
  }

  serialize() {
    return JSON.stringify(this.env, null, 2)
  }
}

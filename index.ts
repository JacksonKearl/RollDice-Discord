require("dotenv").config()

import { keepAlive, eventHandlers } from "./web-interface"
import * as Discord from "discord.js"
import { execute } from "./dice-bot"
import * as Gists from "gists"
import { Environment } from "./environment"

const gists = new Gists({ token: process.env.GITHUB_OAUTH })

let rawEnv: string

const downloadEnv = async () => {
  console.log("Loading environment from gist...")
  const res = await gists.get(process.env.GIST_ID)
  rawEnv = res.body.files[process.env.GIST_NAME!].content
  const environment = new Environment(rawEnv)
  console.log("Initialized env to", environment)
  return environment
}

downloadEnv().then(environment => {
  const client = new Discord.Client()
  client.login(process.env.DISCORD_TOKEN)

  client.on("message", message => {
    if (message.author.username === "RollDice") return
    keepAlive()

    const expression = message.content
    try {
      const result = execute(expression, environment.forUser(message.author.username))
      const rollString = `${message.author.username} rolled: **${result.value}**`
      const trace = `\`${result.trace}\``
      const messages = result.messages.map(({ message }) => message).join("\n")
      message.channel.send([rollString, trace, messages].join("\n"))
    } catch (e) {
      message.channel.send(`Unable to execute ${expression}: ${e.message}`)
    }
  })

  const uploadEnv = async () => {
    if (environment.modified) {
      let serialized = environment.serialize()
      console.log("Updating gist to", serialized)
      environment.modified = false
      await gists.edit(process.env.GIST_ID, {
        files: {
          [process.env.GIST_NAME!]: {
            content: serialized
          }
        }
      })
      console.log("Updated gist")
    }
  }

  eventHandlers.setEnv = (env: string) => {
    console.log("Setting env to", env)
    environment = new Environment(env)
    environment.modified = true
    uploadEnv()
  }

  eventHandlers.getEnv = () => environment.serialize()

  // Update gist every minute, if a change has occurred
  setInterval(uploadEnv, 60 * 1000)
})

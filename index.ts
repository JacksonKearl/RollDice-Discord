require("dotenv").config()

import { keepAlive, eventHandlers } from "./dummy-server"
import * as Discord from "discord.js"
import { execute } from "./dice-bot"
import * as Gists from "gists"

const gists = new Gists({ token: process.env.GITHUB_OAUTH })

let rawEnv: string

const downloadEnv = async () => {
  const res = await gists.get(process.env.GIST_ID)
  rawEnv = res.body.files[process.env.GIST_NAME!].content || "{}"
  const environment: Record<string, Record<string, string>> = JSON.parse(rawEnv)
  console.log("Set env to", environment)
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
      const personalEnv = { ...environment.globals, ...environment[message.author.username] }
      const result = execute(expression, personalEnv)
      environment[message.author.username] = personalEnv

      const rollString = `${message.author.username} rolled: **${result.value}**`
      const trace = `\`${result.trace}\``
      const messages = result.messages.map(({ message }) => message).join("\n")
      message.channel.send([rollString, trace, messages].join("\n"))
    } catch (e) {
      message.channel.send(`Unable to execute ${expression}: ${e.message}`)
    }
  })

  const uploadEnv = async () => {
    const env = JSON.stringify(environment, null, 2)
    if (rawEnv === env) return
    console.log("Updating env to", env)
    rawEnv = env
    await gists.edit(process.env.GIST_ID, {
      files: {
        [process.env.GIST_NAME!]: {
          content: env
        }
      }
    })
    console.log("Updated env")
  }

  eventHandlers.uploadEnv = uploadEnv
  eventHandlers.downloadEnv = () => downloadEnv().then(newEnv => (environment = newEnv))

  // Update gist every minute, if a change has occurred
  setInterval(uploadEnv, 60 * 1000)
})

require("dotenv").config()

import { keepAlive } from "./dummy-server"
import * as Discord from "discord.js"
import { execute } from "./dice-bot"
import * as Gists from "gists"

const gists = new Gists({ token: process.env.GITHUB_OAUTH })

// Start by grabbing the env from github gist
gists.get(process.env.GIST_ID).then((res: any) => {
  let rawEnv = res.body.files[process.env.GIST_NAME!].content || "{}"
  const Environment: Record<string, string> = JSON.parse(rawEnv)
  console.log("Set env to", Environment)

  const client = new Discord.Client()
  client.login(process.env.DISCORD_TOKEN)

  client.on("message", message => {
    if (message.author.username === "RollDice") return
    keepAlive()

    const expression = message.content
    try {
      const result = execute(expression, Environment)
      message.channel.send(`**${result.value}**
\`${result.trace}\`
${result.messages.join("\n")}
`)
    } catch (e) {
      message.channel.send(`Unable to parse ${expression}: ${e.message}`)
    }
  })

  // Update gist every minute, if a change has occurred
  setInterval(async () => {
    const env = JSON.stringify(Environment, null, 2)
    if (rawEnv === env) return
    console.log("Updating env to", env)
    await gists.edit(process.env.GIST_ID, {
      files: {
        [process.env.GIST_NAME!]: {
          content: env
        }
      }
    })
    rawEnv = env
    console.log("Updated env")
  }, 60 * 1000)
})

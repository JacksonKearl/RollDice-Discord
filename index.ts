require("dotenv").config()

import { keepAlive } from "./dummy-server"
import * as Discord from "discord.js"
import { execute } from "./dice-bot"

new Discord.Client()
  .on("message", message => {
    keepAlive()
    const expression = message.content.substring(1)
    try {
      const result = execute(expression)
      message.channel.send(`**${result.value}**
\`${result.trace}\`
${result.messages.join("\n")}
`)
    } catch (e) {
      message.channel.send(`Unable to parse ${expression}: ${e.message}`)
    }
  })
  .login(process.env.DISCORD_TOKEN)

require("dotenv").config()

import { keepAlive } from "./dummy-server"
import * as Discord from "discord.js"
import { calculate } from "./calculator-bot"

new Discord.Client()
  .on("message", message => {
    keepAlive()
    if (message.content.startsWith("!")) {
      const expression = message.content.substring(1)
      try {
        message.channel.send(`\`\`\`${expression} = ${calculate(expression)}\`\`\``)
      } catch (e) {
        message.channel.send(`Unable to parse ${expression}: ${e.message}`)
      }
    }
  })
  .login(process.env.DISCORD_TOKEN)

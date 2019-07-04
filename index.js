// Dummy thing to bind to heroku port to keep heroku happy
require("express")()
  .get("/", (req, res) => res.end("i'm up!"))
  .listen(process.env.PORT || 3000);

let Discord = require("discord.js");

let client = new Discord.Client({});

client.on("ready", () => {
  console.log("I am ready!");
});

client.on("messageUpdate", (old, dlo) => {
  if (dlo.content === "ping") {
    dlo.channel.send("gonp");
  }
});

client.on("message", message => {
  // If the message is "ping"
  if (message.content === "ping") {
    // Send "pong" to the same channel
    message.channel.send("pong");
  }
});

client.login("NTk1NDM3ODYwNzE1MzY0MzU4.XRrC9g.nokX-AJvuWTE8khPxdCdToultTI");

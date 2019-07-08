import * as http from "http"
import { parse } from "querystring"

const heartbeat = () => 1000 * 60 * 20 // 20 minutes
const numPings = 6 // keep alive 2 hours past last message

let nextPing: NodeJS.Timeout

const ping = () => http.get(process.env.URL || "http://localhost:3000")

export const keepAlive = (n = numPings) => {
  console.log("Staying alive for " + n + " more heartbeats")
  if (n === 0) return
  ping()
  if (nextPing) clearTimeout(nextPing)
  nextPing = setTimeout(() => keepAlive(n - 1), heartbeat())
}

export const eventHandlers = {
  setEnv: (str: string) => {},
  getEnv: () => "Loading..."
}

const interfaceMarkup = () => `<form method="post" action="/">
    <textarea name="env" style="width: 100%; height: 90%; font-family: monospace">${eventHandlers.getEnv()}</textarea>
    <button type="submit" style="width:100%">Save</button>
</form>`

http
  .createServer((req, res) => {
    console.log("Received request. Staying alive a bit longer.")

    res.setHeader("content-type", "text/html")
    if (req.method === "POST") {
      let body = ""
      req.on("data", chunk => {
        body += chunk.toString()
      })
      req.on("end", () => {
        console.log(parse(body))
        eventHandlers.setEnv(parse(body).env as string)
        res.end(interfaceMarkup())
      })
    } else {
      res.end(interfaceMarkup())
    }
  })
  .listen(process.env.PORT || 3000)

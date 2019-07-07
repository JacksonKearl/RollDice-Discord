import * as http from "http"

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
  downloadEnv: () => {},
  uploadEnv: () => {}
}

http
  .createServer((req, res) => {
    if (req.url!.indexOf("pull") >= 0) eventHandlers.downloadEnv()
    if (req.url!.indexOf("push") >= 0) eventHandlers.uploadEnv()

    console.log("Received request. Staying alive a bit longer.")
    res.end("i'm up!")
  })
  .listen(process.env.PORT || 3000)

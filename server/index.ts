import { createServer } from "http"
import { Server } from "socket.io"
import next from "next"
import { parse } from "url"
import { setupBareServer } from './bare'

const port = parseInt(process.env.PORT || "3000", 10)
const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(server, {
    path: "/api/socket/io",
    addTrailingSlash: false,
  })

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id)

    socket.on("join-channel", (channelId: string) => {
      socket.join(channelId)
      console.log(`User joined channel: ${channelId}`)
    })

    socket.on("leave-channel", (channelId: string) => {
      socket.leave(channelId)
      console.log(`User left channel: ${channelId}`)
    })

    socket.on("send-message", (message: any) => {
      io.to(message.channelId).emit("new-message", message)
    })

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id)
    })
  })

  setupBareServer(server)

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
}) 
import { io } from "socket.io-client"

export const socket = io(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", {
  path: "/api/socket/io",
  addTrailingSlash: false,
  autoConnect: false,
})

socket.on("connect", () => {
  console.log("Connected to socket server")
})

socket.on("disconnect", () => {
  console.log("Disconnected from socket server")
})


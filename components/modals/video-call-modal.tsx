"use client"

import { useEffect, useRef, useState } from "react"
import { SkyWayContext, SkyWayRoom } from "@skyway-sdk/room"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/use-modal-store"
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react"

export function VideoCallModal() {
  const { isOpen, onClose, type } = useModal()
  const [room, setRoom] = useState<SkyWayRoom>()
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  const isModalOpen = isOpen && type === "videoCall"

  useEffect(() => {
    if (isModalOpen) {
      const context = new SkyWayContext({
        token: process.env.NEXT_PUBLIC_SKYWAY_TOKEN!
      })

      const initRoom = async () => {
        try {
          const room = await SkyWayRoom.FindOrCreate(context, {
            type: "p2p",
            name: "test-room"
          })
          setRoom(room)

          const media = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          })

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = media
          }

          room.onStreamPublished.add(async (e) => {
            const { stream } = e
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream
            }
          })
        } catch (error) {
          console.error("Failed to initialize video call:", error)
        }
      }

      initRoom()
    }
  }, [isModalOpen])

  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const tracks = (localVideoRef.current.srcObject as MediaStream)
        .getAudioTracks()
      tracks.forEach(track => track.enabled = !audioEnabled)
      setAudioEnabled(!audioEnabled)
    }
  }

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const tracks = (localVideoRef.current.srcObject as MediaStream)
        .getVideoTracks()
      tracks.forEach(track => track.enabled = !videoEnabled)
      setVideoEnabled(!videoEnabled)
    }
  }

  const handleClose = () => {
    if (localVideoRef.current?.srcObject) {
      const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
    }
    room?.close()
    onClose()
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            ビデオ通話
          </DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg bg-zinc-300"
              />
              <span className="absolute bottom-2 left-2 text-sm text-white bg-black/50 px-2 rounded">
                あなた
              </span>
            </div>
            <div className="relative aspect-video">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-zinc-300"
              />
              <span className="absolute bottom-2 left-2 text-sm text-white bg-black/50 px-2 rounded">
                相手
              </span>
            </div>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            <Button
              onClick={toggleAudio}
              variant="outline"
              size="icon"
            >
              {audioEnabled ? <Mic /> : <MicOff />}
            </Button>
            <Button
              onClick={toggleVideo}
              variant="outline"
              size="icon"
            >
              {videoEnabled ? <Video /> : <VideoOff />}
            </Button>
            <Button
              onClick={handleClose}
              variant="destructive"
              size="icon"
            >
              <PhoneOff />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
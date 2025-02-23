"use client"

import { useEffect, useRef, useState } from "react"
import { LocalVideo } from "./local-video"
import { RemoteVideo } from "./remote-video"
import { Button } from "../ui/button"
import { Mic, MicOff, Video, VideoOff, Monitor, StopCircle } from "lucide-react"
import {
  type LocalAudioStream,
  type LocalVideoStream,
  RemoteAudioStream,
  RemoteVideoStream,
  SkyWayContext,
  SkyWayRoom,
  SkyWayStreamFactory,
} from "@skyway-sdk/room"

interface MediaProps {
  channelId: string
  type: "voice" | "video"
}

export function VoiceVideo({ channelId, type }: MediaProps) {
  const [room, setRoom] = useState<SkyWayRoom>()
  const [localStream, setLocalStream] = useState<LocalVideoStream>()
  const [localAudio, setLocalAudio] = useState<LocalAudioStream>()
  const [remoteStreams, setRemoteStreams] = useState<RemoteVideoStream[]>([])
  const [remoteAudios, setRemoteAudios] = useState<RemoteAudioStream[]>([])
  const [isVideoEnabled, setIsVideoEnabled] = useState(type === "video")
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  useEffect(() => {
    const init = async () => {
      const context = await SkyWayContext.Create(process.env.NEXT_PUBLIC_SKYWAY_APP_ID!)
      const room = await SkyWayRoom.Create(context, {
        type: "p2p",
        name: channelId,
      })

      setRoom(room)

      // 音声ストリームの初期化
      const audioStream = await SkyWayStreamFactory.createMicrophoneAudioStream()
      setLocalAudio(audioStream)
      await room.publish(audioStream)

      // ビデオチャンネルの場合、ビデオストリームも初期化
      if (type === "video") {
        const videoStream = await SkyWayStreamFactory.createCameraVideoStream()
        setLocalStream(videoStream)
        await room.publish(videoStream)
      }

      // リモートストリームの購読
      room.onStreamPublished.add(async (e) => {
        const stream = e.stream
        await room.subscribe(stream.id)

        if (stream instanceof RemoteVideoStream) {
          setRemoteStreams((prev) => [...prev, stream])
        } else if (stream instanceof RemoteAudioStream) {
          setRemoteAudios((prev) => [...prev, stream])
        }
      })
    }

    init()

    return () => {
      localStream?.release()
      localAudio?.release()
      room?.dispose()
    }
  }, [channelId, type, localAudio?.release]) // Added localAudio?.release to dependencies

  const toggleVideo = async () => {
    if (!room) return

    if (isVideoEnabled) {
      localStream?.release()
      setLocalStream(undefined)
    } else {
      const videoStream = await SkyWayStreamFactory.createCameraVideoStream()
      setLocalStream(videoStream)
      await room.publish(videoStream)
    }
    setIsVideoEnabled(!isVideoEnabled)
  }

  const toggleAudio = () => {
    if (localAudio) {
      localAudio.setEnabled(!isAudioEnabled)
      setIsAudioEnabled(!isAudioEnabled)
    }
  }

  const toggleScreenShare = async () => {
    if (!room) return

    if (isScreenSharing) {
      localStream?.release()
      const videoStream = await SkyWayStreamFactory.createCameraVideoStream()
      setLocalStream(videoStream)
      await room.publish(videoStream)
    } else {
      localStream?.release()
      const screenStream = await SkyWayStreamFactory.createScreenVideoStream()
      setLocalStream(screenStream)
      await room.publish(screenStream)
    }
    setIsScreenSharing(!isScreenSharing)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        <LocalVideo stream={localStream} muted />
        {remoteStreams.map((stream) => (
          <RemoteVideo key={stream.id} stream={stream} />
        ))}
      </div>
      <div className="p-4 border-t flex items-center justify-center gap-4">
        <Button onClick={toggleAudio} variant={isAudioEnabled ? "default" : "destructive"}>
          {isAudioEnabled ? <Mic /> : <MicOff />}
        </Button>
        {type === "video" && (
          <Button onClick={toggleVideo} variant={isVideoEnabled ? "default" : "destructive"}>
            {isVideoEnabled ? <Video /> : <VideoOff />}
          </Button>
        )}
        {type === "video" && (
          <Button onClick={toggleScreenShare} variant={isScreenSharing ? "destructive" : "default"}>
            {isScreenSharing ? <StopCircle /> : <Monitor />}
          </Button>
        )}
      </div>
    </div>
  )
}


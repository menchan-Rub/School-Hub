"use client"

import { useEffect, useRef, useState } from 'react'
import { SkyWayContext, SkyWayRoom } from '@skyway-sdk/room'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react'

interface VideoCallProps {
  onClose: () => void
}

export function VideoCall({ onClose }: VideoCallProps) {
  const [room, setRoom] = useState<SkyWayRoom>()
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const initContext = async () => {
      const context = await SkyWayContext.Create(process.env.NEXT_PUBLIC_SKYWAY_APP_ID!, {
        log: { level: 'error' },
        rtcConfig: {
          timeout: 30_000
        }
      })

      const initRoom = async () => {
        const room = await SkyWayRoom.FindOrCreate(context, {
          type: 'p2p',
          name: 'test-room'
        })
        setRoom(room)

        // ローカルのビデオストリームを取得
        const media = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = media
        }

        // リモートのビデオストリームを購読
        room.onStreamPublished.add(async (e) => {
          const publication = e.publication
          if (remoteVideoRef.current && publication.contentType === 'video') {
            const stream = await publication.stream
            if (stream && stream instanceof MediaStream) {
              remoteVideoRef.current.srcObject = stream
            }
          }
        })
      }

      initRoom()
    }

    initContext()
  }, [])

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

  return (
    <Card className="fixed bottom-4 right-4 p-4 w-96">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg bg-muted"
          />
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-muted"
          />
        </div>
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAudio}
          >
            {audioEnabled ? <Mic /> : <MicOff />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVideo}
          >
            {videoEnabled ? <Video /> : <VideoOff />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={onClose}
          >
            <PhoneOff />
          </Button>
        </div>
      </div>
    </Card>
  )
} 
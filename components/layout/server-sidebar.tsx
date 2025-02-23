"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ServerHeader } from "./server-header"
import { ServerSearch } from "./server-search"
import { ServerSection } from "./server-section"
import { ServerChannel } from "./server-channel"
import { ServerMemberItem } from "./server-member"
import { Hash } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Channel, Member, Profile, Server } from "@prisma/client"
import { useNavigationStore } from '@/lib/stores/navigation-store'

interface ServerSidebarProps {
  serverId: string
}

export function ServerSidebar({ serverId }: ServerSidebarProps) {
  const router = useRouter()
  const params = useParams()
  const { setActiveView } = useNavigationStore()
  
  const [server, setServer] = useState<Server | null>(null)
  const [members, setMembers] = useState<(Member & { user: Profile })[]>([])
  const [channels, setChannels] = useState<Channel[]>([])

  useEffect(() => {
    // サーバー情報を取得
    const fetchServerData = async () => {
      try {
        const response = await fetch(`/api/servers/${serverId}`)
        const data = await response.json()
        
        setServer(data.server)
        setMembers(data.members)
        setChannels(data.channels)
      } catch (error) {
        console.error("Failed to fetch server data:", error)
      }
    }

    if (serverId) {
      fetchServerData()
    }
  }, [serverId])

  if (!server) {
    return null
  }

  const role = server.members.find((member) => member.userId === params?.userId)?.role

  // チャンネルをクリックしたときのハンドラー
  const onChannelClick = (channelId: string) => {
    setActiveView(channelId)
  }

  // メンバーをクリックしたときのハンドラー
  const onMemberClick = (memberId: string) => {
    setActiveView(memberId)
  }

  return (
    <div className="flex flex-col h-full w-full dark:bg-[#2B2D31] bg-[#F2F3F5]">
      <ServerHeader server={server} role={role} />
      <ScrollArea className="flex-1 px-3">
        <div className="mt-2">
          <ServerSearch
            data={[
              {
                label: "テキストチャンネル",
                type: "channel",
                data: channels?.map((channel) => ({
                  id: channel.id,
                  name: channel.name,
                  icon: Hash,
                }))
              },
              {
                label: "メンバー",
                type: "member",
                data: members?.map((member) => ({
                  id: member.id,
                  name: member.user.name,
                  icon: member.user.image
                }))
              }
            ]}
          />
        </div>
        <Separator className="my-2 bg-zinc-200 dark:bg-zinc-700" />
        {channels.length > 0 && (
          <div className="mb-2">
            <ServerSection
              sectionType="channels"
              channelType="text"
              role={role}
              label="テキストチャンネル"
            >
              {channels.map((channel) => (
                <ServerChannel
                  key={channel.id}
                  channel={channel}
                  role={role}
                  server={server}
                  onClick={() => onChannelClick(channel.id)}
                />
              ))}
            </ServerSection>
          </div>
        )}
        {members.length > 0 && (
          <div className="mb-2">
            <ServerSection
              sectionType="members"
              role={role}
              label="メンバー"
              server={server}
            >
              {members.map((member) => (
                <ServerMemberItem
                  key={member.id}
                  member={member}
                  server={server}
                  onClick={() => onMemberClick(member.id)}
                />
              ))}
            </ServerSection>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}


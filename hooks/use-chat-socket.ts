import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { Member, Message, Profile } from "@/lib/types"
import { useSocket } from "@/components/providers/socket-provider"

type ChatSocketProps = {
  addKey: string
  updateKey: string
  queryKey: string
}

type MessageWithMemberWithProfile = Message & {
  member: Member & {
    profile: Profile
  }
}

export const useChatSocket = ({ addKey, updateKey, queryKey }: ChatSocketProps) => {
  const { socket } = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) {
      return
    }

    socket.on(addKey, (message: MessageWithMemberWithProfile) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [
              {
                items: [message],
              },
            ],
          }
        }

        const newData = { ...oldData, pages: [...oldData.pages] }

        newData.pages[0] = {
          ...newData.pages[0],
          items: [message, ...newData.pages[0].items],
        }

        return newData
      })
    })

    socket.on(updateKey, (message: MessageWithMemberWithProfile) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return oldData
        }

        const newData = { ...oldData, pages: [...oldData.pages] }

        newData.pages = newData.pages.map((page: any) => {
          return {
            ...page,
            items: page.items.map((item: MessageWithMemberWithProfile) => {
              if (item.id === message.id) {
                return message
              }
              return item
            }),
          }
        })

        return newData
      })
    })

    return () => {
      socket.off(addKey)
      socket.off(updateKey)
    }
  }, [queryClient, addKey, queryKey, socket, updateKey])
}


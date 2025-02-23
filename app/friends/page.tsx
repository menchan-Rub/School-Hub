"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus, Check, X } from "lucide-react"
import { toast } from "sonner"

export default function FriendsPage() {
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])

  useEffect(() => {
    fetch("/api/friends")
      .then((res) => res.json())
      .then((data) => {
        setFriends(data.filter((f: any) => f.status === "accepted"))
        setRequests(data.filter((f: any) => f.status === "pending"))
      })
  }, [])

  const handleAccept = async (requestId: string) => {
    await fetch(`/api/friends/${requestId}/accept`, {
      method: "POST",
    })
    toast.success("フレンド申請を承認しました")
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">フレンド</h1>
      
      <div className="grid gap-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">フレンド申請</h2>
          {requests.map((request: any) => (
            <div key={request.id} className="flex items-center justify-between p-2">
              <span>{request.sender.name}</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAccept(request.id)}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button variant="destructive" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">フレンド一覧</h2>
          {friends.map((friend: any) => (
            <div key={friend.id} className="flex items-center justify-between p-2">
              <span>{friend.receiver.name}</span>
              <Button variant="destructive" size="sm">
                <UserMinus className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
} 
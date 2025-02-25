import { useFriends } from '@/hooks/use-friends'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserAvatar } from '@/components/ui/user-avatar'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useState } from 'react'

interface FriendsListProps {
  onBack: () => void
}

export function FriendsList({ onBack }: FriendsListProps) {
  const { friends, pendingRequests, isLoading, acceptFriendRequest, rejectFriendRequest } = useFriends()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFriends = friends.filter(friend => 
    friend.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">フレンド</h1>
          <p className="text-muted-foreground">
            {friends.length}人のフレンド
          </p>
        </div>
        <Button onClick={onBack} variant="outline">
          戻る
        </Button>
      </div>

      <Tabs defaultValue="friends">
        <TabsList className="mb-4">
          <TabsTrigger value="friends">
            フレンド
          </TabsTrigger>
          <TabsTrigger value="pending">
            申請中 {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <Input
            placeholder="フレンドを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />

          <div className="space-y-4">
            {filteredFriends.map(friend => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-4 rounded-lg bg-card"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    user={friend.user}
                    fallback={friend.user.name[0]}
                  />
                  <div>
                    <p className="font-medium">{friend.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      オンライン
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    メッセージ
                  </Button>
                  <Button variant="destructive" size="sm">
                    削除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingRequests.map(request => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 rounded-lg bg-card"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    user={request.user}
                    fallback={request.user.name[0]}
                  />
                  <div>
                    <p className="font-medium">{request.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      フレンド申請が届いています
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => acceptFriendRequest(request.id)}
                  >
                    承認
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rejectFriendRequest(request.id)}
                  >
                    拒否
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
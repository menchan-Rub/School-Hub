import { useServers } from '@/hooks/use-servers'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ServerSettingsDialog } from './ServerSettingsDialog'

export function ServerManagement() {
  const { servers } = useServers()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {servers.map(server => (
        <Card key={server.id}>
          <CardHeader>
            <CardTitle>{server.name}</CardTitle>
            <CardDescription>
              {server.members.length}メンバー • {server.channels.length}チャンネル
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServerSettingsDialog server={server} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 
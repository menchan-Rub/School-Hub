import { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ServerStats {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'maintenance';
    cpu: number;
    memory: number;
    disk: number;
    uptime: string;
}

export function ServerMonitoringSection() {
    const [servers, setServers] = useState<ServerStats[]>([]);

    const getStatusColor = (status: ServerStats['status']) => {
        switch (status) {
            case 'online':
                return 'bg-green-500';
            case 'offline':
                return 'bg-red-500';
            case 'maintenance':
                return 'bg-yellow-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>サーバー監視</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {servers.map(server => (
                        <div
                            key={server.id}
                            className="space-y-2"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(server.status)}`} />
                                    <span className="font-medium">{server.name}</span>
                                </div>
                                <Badge>
                                    {server.status}
                                </Badge>
                            </div>

                            <div className="grid gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>CPU</span>
                                        <span>{server.cpu}%</span>
                                    </div>
                                    <Progress value={server.cpu} />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>メモリ</span>
                                        <span>{server.memory}%</span>
                                    </div>
                                    <Progress value={server.memory} />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>ディスク</span>
                                        <span>{server.disk}%</span>
                                    </div>
                                    <Progress value={server.disk} />
                                </div>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                稼働時間: {server.uptime}
                            </div>
                        </div>
                    ))}

                    {servers.length === 0 && (
                        <div className="text-center text-muted-foreground">
                            監視対象のサーバーがありません
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 
import { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityAlert {
    id: string;
    type: 'high' | 'medium' | 'low';
    message: string;
    timestamp: string;
    resolved: boolean;
}

export function SecuritySection() {
    const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

    const getAlertIcon = (type: SecurityAlert['type']) => {
        switch (type) {
            case 'high':
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            case 'medium':
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'low':
                return <Shield className="h-4 w-4 text-blue-500" />;
        }
    };

    const handleResolveAlert = async (alertId: string) => {
        try {
            const response = await fetch(`/api/admin/security/alerts/${alertId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ resolved: true }),
            });

            if (!response.ok) throw new Error('アラートの更新に失敗しました');

            setAlerts(alerts.map(alert => 
                alert.id === alertId ? { ...alert, resolved: true } : alert
            ));
        } catch (error) {
            console.error('Failed to resolve alert:', error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>セキュリティ監視</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {alerts.map(alert => (
                        <div
                            key={alert.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-secondary/10"
                        >
                            <div className="flex items-center gap-4">
                                {getAlertIcon(alert.type)}
                                <div>
                                    <p className="font-medium">{alert.message}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {alert.timestamp}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Badge
                                    variant={alert.resolved ? 'default' : 'destructive'}
                                >
                                    {alert.resolved ? '解決済み' : '未解決'}
                                </Badge>
                                {!alert.resolved && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleResolveAlert(alert.id)}
                                    >
                                        解決済みにする
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}

                    {alerts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                            <p className="text-lg font-medium">セキュリティ警告はありません</p>
                            <p className="text-sm text-muted-foreground">
                                システムは正常に動作しています
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 
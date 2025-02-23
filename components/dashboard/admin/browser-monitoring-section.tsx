import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface BrowserMetrics {
    timestamp: number;
    memory: {
        process: {
            heapUsed: { value: number; unit: string };
        };
        system: {
            used: { value: number; unit: string };
        };
    };
    cpu: {
        loadAverage: {
            '1min': number;
        };
    };
}

interface SecurityAlert {
    type: 'warning' | 'error';
    message: string;
    timestamp: number;
}

export function BrowserMonitoringSection() {
    const [metrics, setMetrics] = useState<BrowserMetrics[]>([]);
    const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
    const [activeUsers, setActiveUsers] = useState(0);
    const [totalTabs, setTotalTabs] = useState(0);
    const { toast } = useToast();

    useEffect(() => {
        // メトリクスの定期的な取得
        const fetchMetrics = async () => {
            try {
                const response = await fetch('/api/admin/browser/metrics');
                const data = await response.json();
                setMetrics(prev => [...prev, data].slice(-30)); // 直近30件を保持
            } catch (error) {
                console.error('メトリクス取得エラー:', error);
            }
        };

        // セキュリティアラートの取得
        const fetchAlerts = async () => {
            try {
                const response = await fetch('/api/admin/browser/alerts');
                const data = await response.json();
                setAlerts(data);
            } catch (error) {
                console.error('アラート取得エラー:', error);
            }
        };

        // 統計情報の取得
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/admin/browser/stats');
                const data = await response.json();
                setActiveUsers(data.activeUsers);
                setTotalTabs(data.totalTabs);
            } catch (error) {
                console.error('統計情報取得エラー:', error);
            }
        };

        // 初回実行
        fetchMetrics();
        fetchAlerts();
        fetchStats();

        // 定期的な更新
        const metricsInterval = setInterval(fetchMetrics, 60000); // 1分ごと
        const alertsInterval = setInterval(fetchAlerts, 30000); // 30秒ごと
        const statsInterval = setInterval(fetchStats, 60000); // 1分ごと

        return () => {
            clearInterval(metricsInterval);
            clearInterval(alertsInterval);
            clearInterval(statsInterval);
        };
    }, []);

    const handleOptimize = async () => {
        try {
            await fetch('/api/admin/browser/optimize', { method: 'POST' });
            toast({
                title: '最適化を実行しました',
                description: 'ブラウザのパフォーマンスが改善されました。'
            });
        } catch (error) {
            toast({
                title: '最適化に失敗しました',
                description: 'もう一度お試しください。',
                variant: 'destructive'
            });
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>ブラウザ監視ダッシュボード</CardTitle>
                    <CardDescription>
                        リアルタイムのパフォーマンスとセキュリティ監視
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-4 bg-secondary rounded-lg">
                            <div className="text-sm font-medium">アクティブユーザー</div>
                            <div className="text-2xl font-bold">{activeUsers}</div>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg">
                            <div className="text-sm font-medium">合計タブ数</div>
                            <div className="text-2xl font-bold">{totalTabs}</div>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg">
                            <div className="text-sm font-medium">メモリ使用率</div>
                            <div className="text-2xl font-bold">
                                {metrics[metrics.length - 1]?.memory.system.used.value || 0}
                                {metrics[metrics.length - 1]?.memory.system.used.unit || 'MB'}
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">パフォーマンスメトリクス</h3>
                        <LineChart width={800} height={300} data={metrics}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(value) => new Date(value).toLocaleString()}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="memory.process.heapUsed.value"
                                name="ヒープ使用量"
                                stroke="#8884d8"
                            />
                            <Line
                                type="monotone"
                                dataKey="cpu.loadAverage.1min"
                                name="CPU負荷"
                                stroke="#82ca9d"
                            />
                        </LineChart>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-medium">セキュリティアラート</h3>
                            <Badge variant={alerts.length > 0 ? 'destructive' : 'secondary'}>
                                {alerts.length}件
                            </Badge>
                        </div>
                        <div className="space-y-2">
                            {alerts.map((alert, index) => (
                                <Alert key={index} variant={alert.type}>
                                    <AlertDescription>
                                        {alert.message}
                                        <span className="text-sm text-muted-foreground ml-2">
                                            {new Date(alert.timestamp).toLocaleString()}
                                        </span>
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleOptimize}>
                            パフォーマンスを最適化
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 
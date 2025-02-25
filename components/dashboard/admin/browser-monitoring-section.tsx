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
import { Globe, Clock, Users } from 'lucide-react';

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
    type: 'default' | 'destructive';
    message: string;
    timestamp: number;
}

interface BrowserStats {
    id: string;
    url: string;
    activeUsers: number;
    averageLoadTime: string;
    status: 'active' | 'inactive';
    lastUpdated: string;
}

export function BrowserMonitoringSection() {
    const [metrics, setMetrics] = useState<BrowserMetrics[]>([]);
    const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
    const [activeUsers, setActiveUsers] = useState(0);
    const [totalTabs, setTotalTabs] = useState(0);
    const [browsers, setBrowsers] = useState<BrowserStats[]>([]);
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

        // ブラウザ情報の取得
        const fetchBrowsers = async () => {
            try {
                const response = await fetch('/api/admin/browser/browsers');
                const data = await response.json();
                setBrowsers(data);
            } catch (error) {
                console.error('ブラウザ情報取得エラー:', error);
            }
        };

        // 初回実行
        fetchMetrics();
        fetchAlerts();
        fetchStats();
        fetchBrowsers();

        // 定期的な更新
        const metricsInterval = setInterval(fetchMetrics, 60000); // 1分ごと
        const alertsInterval = setInterval(fetchAlerts, 30000); // 30秒ごと
        const statsInterval = setInterval(fetchStats, 60000); // 1分ごと
        const browsersInterval = setInterval(fetchBrowsers, 60000); // 1分ごと

        return () => {
            clearInterval(metricsInterval);
            clearInterval(alertsInterval);
            clearInterval(statsInterval);
            clearInterval(browsersInterval);
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

            <Card>
                <CardHeader>
                    <CardTitle>ブラウザ監視</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {browsers.map(browser => (
                            <div
                                key={browser.id}
                                className="flex items-center justify-between p-4 rounded-lg bg-secondary/10"
                            >
                                <div className="flex items-center gap-4">
                                    <Globe className="h-4 w-4 text-blue-500" />
                                    <div>
                                        <p className="font-medium">{browser.url}</p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                <span>{browser.activeUsers} ユーザー</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>読み込み時間: {browser.averageLoadTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Badge
                                        variant={browser.status === 'active' ? 'default' : 'secondary'}
                                    >
                                        {browser.status === 'active' ? 'アクティブ' : '非アクティブ'}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        最終更新: {browser.lastUpdated}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {browsers.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p>監視対象のブラウザがありません</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 
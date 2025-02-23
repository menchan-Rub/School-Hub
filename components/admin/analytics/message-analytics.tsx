"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { subDays, format } from "date-fns"
import { ja } from "date-fns/locale"

export function MessageAnalytics() {
  const { data: analytics } = useQuery({
    queryKey: ['message-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics/messages')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    }
  })

  const chartData = analytics?.dailyMessages.map((item: any) => ({
    date: format(new Date(item.date), 'M/d', { locale: ja }),
    count: item.count
  })) || []

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>メッセージ傾向分析</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 
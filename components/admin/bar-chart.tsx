"use client"

import { memo } from 'react'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTheme } from 'next-themes'
import { getChartTheme } from '@/lib/chart-theme'

interface BarChartProps {
  data: {
    date: string
    newUsers: number
    activeUsers: number
    messages: number
  }[]
  isDashboard?: boolean
}

export default memo(function BarChart({ isDashboard = false, data = [] }: BarChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const chartTheme = getChartTheme(isDark)

  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center">データがありません</div>
  }

  const chartData = data
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(d => ({
      date: new Date(d.date).toLocaleDateString('ja-JP', { month: 'short' }),
      "新規ユーザー": d.newUsers,
      "アクティブユーザー": d.activeUsers,
      "メッセージ": d.messages
    }))

  return (
    <div className="h-[300px] w-full bg-[#111827]">
      <ResponsiveContainer>
        <RechartsBarChart 
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={chartTheme.grid}
            vertical={false}
          />
          <XAxis 
            dataKey="date" 
            stroke={chartTheme.text}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke={chartTheme.text}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: chartTheme.background,
              border: `1px solid ${chartTheme.grid}`,
              borderRadius: '4px',
              padding: '8px 12px',
            }}
            itemStyle={{
              color: chartTheme.text,
              fontSize: '12px',
            }}
          />
          <Legend 
            wrapperStyle={{
              fontSize: '12px',
              color: chartTheme.text
            }}
          />
          {chartTheme.colors.chart.map((color, index) => (
            <Bar 
              key={Object.keys(chartData[0])[index + 1]}
              dataKey={Object.keys(chartData[0])[index + 1]}
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}) 
"use client"

import { memo } from 'react'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useTheme } from 'next-themes'
import { getChartTheme } from '@/lib/chart-theme'

interface PieChartProps {
  data: {
    role: string
    count: number
  }[]
}

export default memo(function PieChart({ data = [] }: PieChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const chartTheme = getChartTheme(isDark)

  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center">データがありません</div>
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer>
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="role"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={chartTheme.colors.chart[index % chartTheme.colors.chart.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: chartTheme.background,
              border: `1px solid ${chartTheme.grid}`,
              borderRadius: '4px',
              padding: '8px 12px',
            }}
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}) 
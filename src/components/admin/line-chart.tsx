import { LineChart as Chart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface LineChartProps {
  data: Array<{
    date: string
    count: number
  }>
}

export default function LineChart({ data = [] }: LineChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        データがありません
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <Chart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(value) => {
            const date = new Date(value)
            return `${date.getMonth() + 1}/${date.getDate()}`
          }}
        />
        <YAxis />
        <Tooltip 
          labelFormatter={(label) => {
            const date = new Date(label)
            return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
          }}
        />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </Chart>
    </ResponsiveContainer>
  )
} 
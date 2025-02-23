"use client"

import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface LineChartProps {
  data: { date: string; count: number }[]
}

export default function LineChart({ data }: LineChartProps) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: "Active Users",
        data: data.map(d => d.count),
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.4,
        fill: true
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)"
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }

  return <Line data={chartData} options={options} height={300} />
} 
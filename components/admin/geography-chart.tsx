import { ResponsiveChoropleth } from "@nivo/geo"
import { useTheme } from "@mui/material"
import { tokens } from "@/lib/theme"
import { geoFeatures } from "./mock-geo-features"

interface GeographyChartProps {
  isDashboard?: boolean
  data?: Array<{
    country: string
    users: number
  }>
}

export function GeographyChart({ isDashboard = false, data = [] }: GeographyChartProps) {
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)

  const chartData = data.map(item => ({
    id: item.country,
    value: item.users
  }))

  return (
    <ResponsiveChoropleth
      data={chartData}
      features={geoFeatures.features}
      theme={{
        axis: {
          domain: {
            line: {
              stroke: colors.grey[100]
            }
          },
          legend: {
            text: {
              fill: colors.grey[100]
            }
          },
          ticks: {
            line: {
              stroke: colors.grey[100],
              strokeWidth: 1
            },
            text: {
              fill: colors.grey[100]
            }
          }
        },
        legends: {
          text: {
            fill: colors.grey[100]
          }
        }
      }}
      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      domain={[0, 1000000]}
      unknownColor="#666666"
      label="properties.name"
      valueFormat=".2s"
      projectionScale={isDashboard ? 40 : 150}
      projectionTranslation={isDashboard ? [0.49, 0.6] : [0.5, 0.5]}
      projectionRotation={[0, 0, 0]}
      borderWidth={1.5}
      borderColor="#ffffff"
    />
  )
} 
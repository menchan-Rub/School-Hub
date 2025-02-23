import { Box, Typography, useTheme } from "@mui/material"
import { tokens } from "@/lib/theme"
import { ProgressCircle } from "@/components/ui/progress-circle"

interface StatBoxProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  progress: number
  increase: string
}

export const StatBoxDynamic = ({ title, subtitle, icon, progress, increase }: StatBoxProps) => {
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)

  return (
    <Box
      sx={{
        gridColumn: "span 3",
        backgroundColor: colors.primary[400],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: "30px",
        borderRadius: "4px"
      }}
    >
      <Box width="100%" m="0 30px">
        <Box display="flex" justifyContent="space-between">
          <Box>
            {icon}
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{ color: colors.grey[100] }}
            >
              {title}
            </Typography>
          </Box>
          <Box>
            <ProgressCircle progress={progress} />
          </Box>
        </Box>
        <Box display="flex" justifyContent="space-between" mt="2px">
          <Typography variant="h5" sx={{ color: colors.greenAccent[500] }}>
            {subtitle}
          </Typography>
          <Typography
            variant="h5"
            fontStyle="italic"
            sx={{ color: colors.greenAccent[600] }}
          >
            {increase}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
} 
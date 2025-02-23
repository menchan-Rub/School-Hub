import { Box, Typography } from "@mui/material"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressCircle } from "@/components/admin/progress-circle"

interface StatBoxProps {
  title: string
  value: string | number
  icon: any
  progress: number
  increase: string
  description: string
}

export function StatBox({ title, value, icon: Icon, progress, increase, description }: StatBoxProps) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between">
          <Box>
            <Icon className="h-6 w-6 text-primary" />
            <Typography variant="h4" fontWeight="bold" className="mt-2">
              {value}
            </Typography>
          </Box>
          <Box>
            <ProgressCircle progress={progress} />
          </Box>
        </Box>
        <Box display="flex" justifyContent="space-between" mt="2px">
          <Typography variant="h5" className="text-primary">
            {title}
          </Typography>
          <Typography variant="h5" fontStyle="italic" className="text-green-500 dark:text-green-400">
            {increase}
          </Typography>
        </Box>
        <Typography className="text-xs text-muted-foreground mt-1">
          {description}
        </Typography>
      </CardContent>
    </Card>
  )
}
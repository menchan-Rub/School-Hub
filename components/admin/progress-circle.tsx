import { Box } from "@mui/material"

interface ProgressCircleProps {
  progress?: number
  size?: string
}

export function ProgressCircle({ progress = 0.75, size = "40" }: ProgressCircleProps) {
  const angle = progress * 360

  return (
    <Box
      sx={{
        background: `radial-gradient(hsl(var(--background)) 55%, transparent 56%),
            conic-gradient(transparent 0deg ${angle}deg, hsl(var(--primary)) ${angle}deg 360deg),
            hsl(var(--primary) / 0.2)`,
        borderRadius: "50%",
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  )
} 
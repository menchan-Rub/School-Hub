"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function useThemeEffects() {
  const { theme } = useTheme()
  const [gradientColors, setGradientColors] = useState({
    primary: "from-indigo-500 to-purple-500",
    secondary: "from-pink-500 to-rose-500"
  })

  useEffect(() => {
    if (theme === "dark") {
      setGradientColors({
        primary: "from-indigo-400 to-purple-400",
        secondary: "from-pink-400 to-rose-400"
      })
    }
  }, [theme])

  return gradientColors
} 
import { createContext, useState, useMemo } from "react"
import { createTheme } from "@mui/material"
import { tokens as colorTokens } from "./utils/theme"

export const theme = createTheme({
  palette: {
    mode: "dark",
  },
  typography: {
    fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
    fontSize: 12,
  },
})

export const tokens = colorTokens

export const themeSettings = (mode: "light" | "dark") => {
  const colors = colorTokens(mode)
  
  return {
    palette: {
      mode: mode,
      primary: {
        main: colors.primary[100]
      }
    },
    typography: {
      fontFamily: ["Noto Sans JP", "sans-serif"].join(",")
    }
  }
}

export const ColorModeContext = createContext({ toggleColorMode: () => {} })

export const useMode = () => {
  const [mode, setMode] = useState<"light" | "dark">("dark")

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    []
  )

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode])
  return [theme, colorMode] as const
} 
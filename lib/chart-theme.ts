export const getChartTheme = (isDark: boolean) => ({
  background: isDark ? '#111827' : '#FFFFFF',
  text: isDark ? '#e2e8f0' : '#1e293b',
  grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
  colors: {
    primary: isDark ? '#10B981' : '#059669',
    secondary: isDark ? '#818CF8' : '#6366F1',
    accent: isDark ? '#F87171' : '#EF4444',
    chart: [
      isDark ? '#10B981' : '#059669',
      isDark ? '#818CF8' : '#6366F1',
      isDark ? '#F87171' : '#EF4444'
    ]
  }
}) 
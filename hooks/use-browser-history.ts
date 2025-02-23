export function useBrowserHistory() {
  const [history, setHistory] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  const pushHistory = (url: string) => {
    setHistory(prev => [...prev.slice(0, currentIndex + 1), url])
    setCurrentIndex(prev => prev + 1)
  }

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      return history[currentIndex - 1]
    }
  }

  const goForward = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1)
      return history[currentIndex + 1]
    }
  }

  return { pushHistory, goBack, goForward, canGoBack: currentIndex > 0, canGoForward: currentIndex < history.length - 1 }
} 
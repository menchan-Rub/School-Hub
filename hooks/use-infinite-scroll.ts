import { useInfiniteQuery } from "@tanstack/react-query"
import qs from "query-string"

interface UseInfiniteScrollProps {
  apiUrl: string
  paramKey: string
  paramValue: string
}

export function useInfiniteScroll({
  apiUrl,
  paramKey,
  paramValue
}: UseInfiniteScrollProps) {
  const fetchMessages = async ({ pageParam = undefined }) => {
    const url = qs.stringifyUrl({
      url: apiUrl,
      query: {
        cursor: pageParam,
        [paramKey]: paramValue,
      }
    }, { skipNull: true })

    const res = await fetch(url)
    return res.json()
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [apiUrl, paramKey, paramValue],
    queryFn: fetchMessages,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    initialPageParam: undefined,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  })

  return {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  }
} 

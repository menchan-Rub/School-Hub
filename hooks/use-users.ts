import { useQuery } from "@tanstack/react-query"
import { User } from "@/lib/types"

async function getUsers(): Promise<User[]> {
  const response = await fetch("/api/users")
  return response.json()
}

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: getUsers
  })
} 
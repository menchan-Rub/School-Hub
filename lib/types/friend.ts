export interface Friend {
  id: string
  userId: string
  friendId: string
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED'
  createdAt: Date
  user: {
    id: string
    name: string
    image?: string
  }
} 
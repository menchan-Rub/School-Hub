import { Server, Member, Profile } from "@prisma/client"

export type ServerWithMembersWithUsers = Server & {
  members: (Member & {
    user: Profile
  })[]
} 
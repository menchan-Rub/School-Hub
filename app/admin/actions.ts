"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateUser(userId: string, data: any) {
  await prisma.user.update({
    where: { id: userId },
    data
  })
  revalidatePath("/admin")
}

export async function updateUserRole(userId: string, role: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { roleId: role }
  })
  revalidatePath("/admin")
}

export async function updateUserStatus(userId: string, status: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { status }
  })
  revalidatePath("/admin")
}

export async function deleteUser(userId: string) {
  await prisma.user.delete({
    where: { id: userId }
  })
  revalidatePath("/admin")
} 
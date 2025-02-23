import { createUploadthing, type FileRouter } from "uploadthing/next"
import { getServerSession } from "next-auth"

const f = createUploadthing()

export const ourFileRouter = {
  serverImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession()
      if (!session?.user) throw new Error("認証が必要です")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete:", { uploadedBy: metadata.userId, url: file.url })
    }),
  messageFile: f(["image", "pdf"])
    .middleware(async () => {
      const session = await getServerSession()
      if (!session?.user) throw new Error("認証が必要です")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete:", { uploadedBy: metadata.userId, url: file.url })
    })
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter


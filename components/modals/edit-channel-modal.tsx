"use client"

import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { useModal } from "@/lib/hooks/use-modal-store"
import { Hash, Volume2, Video } from "lucide-react"
import qs from "query-string"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type ChannelType = "TEXT" | "AUDIO" | "VIDEO"

const formSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: "チャンネル名を入力してください。",
    })
    .refine((name) => name !== "general", {
      message: "チャンネル名にgeneralは使用できません。",
    }),
  type: z.enum(["TEXT", "AUDIO", "VIDEO"] as const),
})

type FormValues = z.infer<typeof formSchema>

export const EditChannelModal = () => {
  const { isOpen, onClose, type, data } = useModal()
  const router = useRouter()

  const isModalOpen = isOpen && type === "editChannel"
  const { channel, server } = data

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: (channel?.type as ChannelType) || "TEXT",
    },
  })

  const isLoading = form.formState.isSubmitting

  const onSubmit = async (values: FormValues) => {
    try {
      const url = qs.stringifyUrl({
        url: `/api/channels/${channel?.id}`,
        query: {
          serverId: server?.id,
        },
      })

      await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      form.reset()
      router.refresh()
      onClose()
    } catch (error) {
      console.log(error)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">チャンネルを編集</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8 px-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                      チャンネル名
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
                        placeholder="チャンネルの名前を入力"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>チャンネルタイプ</FormLabel>
                    <Select disabled={isLoading} onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-300/50 border-0 focus:ring-0 text-black ring-offset-0 focus:ring-offset-0 capitalize outline-none">
                          <SelectValue placeholder="チャンネルタイプを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TEXT">
                          <div className="flex items-center gap-x-2">
                            <Hash className="h-4 w-4" />
                            <span>テキスト</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="AUDIO">
                          <div className="flex items-center gap-x-2">
                            <Volume2 className="h-4 w-4" />
                            <span>音声</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="VIDEO">
                          <div className="flex items-center gap-x-2">
                            <Video className="h-4 w-4" />
                            <span>ビデオ</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="bg-gray-100 px-6 py-4">
              <Button variant="default" disabled={isLoading}>
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}


"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import { Server, ServerChannel, ChannelType } from "@/lib/types/server"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { PermissionManager } from "@/lib/permissions"

const formSchema = z.object({
  name: z.string()
    .min(1, "チャンネル名は必須です")
    .max(100, "チャンネル名は100文字以内で入力してください")
    .regex(/^[a-z0-9-]+$/, "チャンネル名は半角英数字とハイフンのみ使用できます"),
  topic: z.string().max(1024, "トピックは1024文字以内で入力してください").optional(),
  type: z.enum(["TEXT", "VOICE", "ANNOUNCEMENT"]),
  nsfw: z.boolean(),
  rateLimitPerUser: z.number().min(0).max(21600),
  parentId: z.string().optional(),
})

interface ChannelSettingsModalProps {
  server: Server
  channel: ServerChannel
  isOpen: boolean
  onClose: () => void
}

export function ChannelSettingsModal({
  server,
  channel,
  isOpen,
  onClose
}: ChannelSettingsModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: channel.name,
      topic: channel.topic || "",
      type: channel.type,
      nsfw: channel.nsfw,
      rateLimitPerUser: channel.rateLimitPerUser,
      parentId: channel.parentId,
    }
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      await axios.patch(`/api/channels/${channel.id}`, values)
      router.refresh()
      onClose()
      toast({
        title: "チャンネル設定を更新しました",
        description: "変更が正常に保存されました",
      })
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "チャンネル設定の更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChannel = async () => {
    try {
      setIsLoading(true)
      await axios.delete(`/api/channels/${channel.id}`)
      router.refresh()
      onClose()
      toast({
        title: "チャンネルを削除しました",
        description: "チャンネルが正常に削除されました",
      })
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "チャンネルの削除に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] h-[600px] bg-[#313338] text-zinc-200">
        <DialogHeader>
          <DialogTitle>チャンネル設定</DialogTitle>
        </DialogHeader>
        <div className="flex h-full">
          <div className="w-[200px] bg-[#2B2D31] p-2">
            <TabsList className="flex flex-col w-full gap-1">
              <TabsTrigger value="general" onClick={() => setActiveTab("general")}>
                一般
              </TabsTrigger>
              <TabsTrigger value="permissions" onClick={() => setActiveTab("permissions")}>
                権限
              </TabsTrigger>
              <TabsTrigger value="invites" onClick={() => setActiveTab("invites")}>
                招待
              </TabsTrigger>
              <Separator className="my-2" />
              <TabsTrigger value="delete" onClick={() => setActiveTab("delete")} className="text-red-500">
                チャンネルを削除
              </TabsTrigger>
            </TabsList>
          </div>
          <ScrollArea className="flex-1 p-4">
            <Tabs value={activeTab} className="w-full">
              <TabsContent value="general">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>チャンネル名</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>トピック</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
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
                          <Select
                            disabled={isLoading}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="チャンネルタイプを選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="TEXT">テキストチャンネル</SelectItem>
                              <SelectItem value="VOICE">ボイスチャンネル</SelectItem>
                              <SelectItem value="ANNOUNCEMENT">アナウンスチャンネル</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nsfw"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>年齢制限チャンネル</FormLabel>
                            <div className="text-[0.8rem] text-zinc-400">
                              このチャンネルを年齢制限付きとしてマークする
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isLoading}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rateLimitPerUser"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>低速モード</FormLabel>
                          <Select
                            disabled={isLoading}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="低速モードを選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">オフ</SelectItem>
                              <SelectItem value="5">5秒</SelectItem>
                              <SelectItem value="10">10秒</SelectItem>
                              <SelectItem value="15">15秒</SelectItem>
                              <SelectItem value="30">30秒</SelectItem>
                              <SelectItem value="60">1分</SelectItem>
                              <SelectItem value="120">2分</SelectItem>
                              <SelectItem value="300">5分</SelectItem>
                              <SelectItem value="600">10分</SelectItem>
                              <SelectItem value="900">15分</SelectItem>
                              <SelectItem value="3600">1時間</SelectItem>
                              <SelectItem value="7200">2時間</SelectItem>
                              <SelectItem value="21600">6時間</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading}>
                      変更を保存
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="delete">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-red-500">チャンネルを削除</h3>
                    <p className="text-sm text-zinc-400">
                      チャンネルを削除すると、すべてのメッセージとファイルが完全に削除されます。
                      この操作は取り消すことができません。
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    disabled={isLoading}
                    onClick={handleDeleteChannel}
                  >
                    チャンネルを削除
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
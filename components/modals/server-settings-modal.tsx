"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import { Server } from "@/lib/types/server"
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
  name: z.string().min(1, "サーバー名は必須です").max(100, "サーバー名は100文字以内で入力してください"),
  description: z.string().max(1000, "説明は1000文字以内で入力してください").optional(),
  imageUrl: z.string().url("有効なURLを入力してください").optional(),
  region: z.string(),
  defaultMessageNotifications: z.enum(["ALL_MESSAGES", "ONLY_MENTIONS"]),
  explicitContentFilter: z.enum(["DISABLED", "MEMBERS_WITHOUT_ROLES", "ALL_MEMBERS"]),
  systemChannelId: z.string().optional(),
  rulesChannelId: z.string().optional(),
})

interface ServerSettingsModalProps {
  server: Server
  isOpen: boolean
  onClose: () => void
}

export function ServerSettingsModal({
  server,
  isOpen,
  onClose
}: ServerSettingsModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: server.name,
      description: server.description || "",
      imageUrl: server.imageUrl || "",
      region: server.region,
      defaultMessageNotifications: server.defaultMessageNotifications,
      explicitContentFilter: server.explicitContentFilter,
      systemChannelId: server.systemChannelId,
      rulesChannelId: server.rulesChannelId,
    }
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      await axios.patch(`/api/servers/${server.id}`, values)
      router.refresh()
      onClose()
      toast({
        title: "サーバー設定を更新しました",
        description: "変更が正常に保存されました",
      })
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "サーバー設定の更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteServer = async () => {
    try {
      setIsLoading(true)
      await axios.delete(`/api/servers/${server.id}`)
      router.refresh()
      router.push("/")
      toast({
        title: "サーバーを削除しました",
        description: "サーバーが正常に削除されました",
      })
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "サーバーの削除に失敗しました",
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
          <DialogTitle>サーバー設定</DialogTitle>
        </DialogHeader>
        <div className="flex h-full">
          <div className="w-[200px] bg-[#2B2D31] p-2">
            <TabsList className="flex flex-col w-full gap-1">
              <TabsTrigger value="general" onClick={() => setActiveTab("general")}>
                一般
              </TabsTrigger>
              <TabsTrigger value="roles" onClick={() => setActiveTab("roles")}>
                役職
              </TabsTrigger>
              <TabsTrigger value="members" onClick={() => setActiveTab("members")}>
                メンバー
              </TabsTrigger>
              <TabsTrigger value="bans" onClick={() => setActiveTab("bans")}>
                BAN
              </TabsTrigger>
              <TabsTrigger value="invites" onClick={() => setActiveTab("invites")}>
                招待
              </TabsTrigger>
              <TabsTrigger value="integrations" onClick={() => setActiveTab("integrations")}>
                連携サービス
              </TabsTrigger>
              <TabsTrigger value="audit-log" onClick={() => setActiveTab("audit-log")}>
                監査ログ
              </TabsTrigger>
              <Separator className="my-2" />
              <TabsTrigger value="delete" onClick={() => setActiveTab("delete")} className="text-red-500">
                サーバーを削除
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
                          <FormLabel>サーバー名</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>説明</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>地域</FormLabel>
                          <Select
                            disabled={isLoading}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="地域を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="japan">日本</SelectItem>
                              <SelectItem value="us">アメリカ</SelectItem>
                              <SelectItem value="europe">ヨーロッパ</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="defaultMessageNotifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>デフォルトの通知設定</FormLabel>
                          <Select
                            disabled={isLoading}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="通知設定を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ALL_MESSAGES">すべてのメッセージ</SelectItem>
                              <SelectItem value="ONLY_MENTIONS">@メンションのみ</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="explicitContentFilter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>不適切なコンテンツのフィルター</FormLabel>
                          <Select
                            disabled={isLoading}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="フィルター設定を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="DISABLED">無効</SelectItem>
                              <SelectItem value="MEMBERS_WITHOUT_ROLES">役職のないメンバーのみ</SelectItem>
                              <SelectItem value="ALL_MEMBERS">すべてのメンバー</SelectItem>
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
                    <h3 className="text-lg font-semibold text-red-500">サーバーを削除</h3>
                    <p className="text-sm text-zinc-400">
                      サーバーを削除すると、すべてのチャンネル、メッセージ、ファイルが完全に削除されます。
                      この操作は取り消すことができません。
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    disabled={isLoading}
                    onClick={handleDeleteServer}
                  >
                    サーバーを削除
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
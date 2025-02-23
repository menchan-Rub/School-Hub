"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

const settingsSchema = z.object({
  name: z.string().min(2, "名前は2文字以上で入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  notifications: z.object({
    messages: z.boolean(),
    mentions: z.boolean(),
    friends: z.boolean(),
    sounds: z.boolean(),
  }),
  privacy: z.object({
    showOnlineStatus: z.boolean(),
    allowFriendRequests: z.boolean(),
    allowDirectMessages: z.boolean(),
  }),
})

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
      email: session?.user?.email ?? "",
      notifications: {
        messages: true,
        mentions: true,
        friends: true,
        sounds: true,
      },
      privacy: {
        showOnlineStatus: true,
        allowFriendRequests: true,
        allowDirectMessages: true,
      },
    },
  })

  const onSubmit = async (values: z.infer<typeof settingsSchema>) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(values),
      })

      if (!response.ok) throw new Error()

      await update({
        ...session,
        user: {
          ...session?.user,
          name: values.name,
          email: values.email,
        },
      })

      toast.success("設定を更新しました")
    } catch (error) {
      toast.error("設定の更新に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationChange = async (key: "messages" | "mentions" | "friends" | "sounds") => {
    const path = `notifications.${key}` as const
    const newValue = !form.getValues(path)
    
    form.setValue(path, newValue)
    
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          notifications: {
            ...form.getValues("notifications"),
            [key]: newValue
          }
        })
      })

      if (!response.ok) throw new Error()
      toast.success("設定を更新しました")
    } catch (error) {
      toast.error("設定の更新に失敗しました")
      // 失敗した場合は値を元に戻す
      form.setValue(path, !newValue)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="container max-w-5xl py-8">
      <h1 className="text-3xl font-bold mb-8">設定</h1>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">アカウント</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
          <TabsTrigger value="privacy">プライバシー</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>アカウント設定</CardTitle>
              <CardDescription>
                アカウントの基本設定を変更できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ユーザー名</Label>
                <Input {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <Label>メールアドレス</Label>
                <Input {...form.register("email")} />
              </div>
              <Button type="submit" disabled={isLoading}>保存</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>通知設定</CardTitle>
              <CardDescription>
                通知の受信設定を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(form.getValues("notifications")).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label>{key === "sounds" ? "通知音" : `${key}の通知`}</Label>
                  <Switch 
                    checked={value}
                    onCheckedChange={() => handleNotificationChange(key as "messages" | "mentions" | "friends" | "sounds")}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>プライバシー設定</CardTitle>
              <CardDescription>
                プライバシーに関する設定を管理します
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* プライバシー設定の内容 */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
} 
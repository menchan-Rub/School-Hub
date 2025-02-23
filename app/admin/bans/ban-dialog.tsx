"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface BanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
}

export function BanDialog({ open, onOpenChange, user }: BanDialogProps) {
  const router = useRouter()
  const [date, setDate] = useState<Date>()
  const [isLoading, setIsLoading] = useState(false)

  if (!user) return null

  async function onBan(type: "temp" | "permanent") {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          until: type === "temp" ? date : null
        })
      })

      if (!response.ok) throw new Error()

      toast.success("BANを設定しました")
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error("エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user.name} をBAN</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">期限付きBAN</h4>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date()}
            />
            <Button 
              onClick={() => onBan("temp")} 
              disabled={!date || isLoading}
              className="mt-2"
            >
              {isLoading ? <LoadingSpinner /> : "期限付きBANを設定"}
            </Button>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium">永久BAN</h4>
            <Button 
              variant="destructive"
              onClick={() => onBan("permanent")}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner /> : "永久BANを設定"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
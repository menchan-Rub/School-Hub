"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import dynamic from "next/dynamic"

const PieChart = dynamic(() => import("@/components/admin/pie-chart"), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-card" />
})

export default function PieChartPage() {
  const { data: session, status } = useSession()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => fetch('/api/admin/stats').then(res => res.json()),
    staleTime: 30000
  })

  if (status === "loading" || isLoading) {
    return <LoadingSpinner />
  }

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>ユーザー分布</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChart data={stats.usersByRole} />
        </CardContent>
      </Card>
    </div>
  )
} 
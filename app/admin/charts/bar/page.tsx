"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BarChart from "@/components/admin/bar-chart"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function BarChartPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <LoadingSpinner />
  }

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => fetch('/api/admin/stats').then(res => res.json())
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>月間統計</CardTitle>
        </CardHeader>
        <CardContent className="h-[600px]">
          {stats?.monthlyStats && <BarChart data={stats.monthlyStats} />}
        </CardContent>
      </Card>
    </div>
  )
} 
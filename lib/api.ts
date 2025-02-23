import { mockUsers, mockStats, mockAnnouncements, mockBannedUsers, mockAuditLogs, mockRoles, mockServers } from "@/lib/mock-data"

// APIクライアントの共通化
export async function fetchData(url: string) {
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // レスポンスが空でないことを確認
    const text = await response.text()
    if (!text) {
      return null
    }

    try {
      return JSON.parse(text)
    } catch (e) {
      console.error('JSON parse error:', e)
      return null
    }

  } catch (error) {
    console.error("API Error:", error)
    throw error
  }
}

export async function postData(url: string, data: any) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",  // クッキーを含める
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API Error:", error)
    throw error
  }
}

export async function putData(url: string, data: any) {
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",  // クッキーを含める
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API Error:", error)
    throw error
  }
} 
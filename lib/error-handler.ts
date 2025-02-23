export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return { message: error.message, statusCode: error.statusCode }
  }
  
  console.error("Unexpected error:", error)
  return { message: "予期せぬエラーが発生しました", statusCode: 500 }
} 
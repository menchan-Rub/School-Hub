interface Extension {
  id: string
  name: string
  version: string
  permissions: string[]
  onMessage?: (message: any) => void
  onTabUpdate?: (tabId: string, changeInfo: any) => void
}

export class ExtensionManager {
  private extensions: Map<string, Extension>
  
  constructor() {
    this.extensions = new Map()
  }

  registerExtension(extension: Extension) {
    this.extensions.set(extension.id, extension)
  }

  unregisterExtension(id: string) {
    this.extensions.delete(id)
  }

  notifyTabUpdate(tabId: string, changeInfo: any) {
    this.extensions.forEach(extension => {
      extension.onTabUpdate?.(tabId, changeInfo)
    })
  }

  sendMessage(extensionId: string, message: any) {
    const extension = this.extensions.get(extensionId)
    extension?.onMessage?.(message)
  }
} 
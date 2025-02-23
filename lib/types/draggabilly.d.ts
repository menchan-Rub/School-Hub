declare module 'draggabilly' {
  export default class Draggabilly {
    constructor(element: Element, options?: {
      axis?: string
      containment?: Element | string
    })
    on(event: string, callback: () => void): void
    destroy(): void
  }
} 
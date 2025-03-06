declare module 'puppeteer' {
  export interface Browser {
    close(): Promise<void>;
    newPage(): Promise<Page>;
  }

  export interface Page {
    goto(url: string): Promise<Response>;
    screenshot(options?: ScreenshotOptions): Promise<Buffer>;
    close(): Promise<void>;
  }

  export interface Response {
    ok(): boolean;
    status(): number;
    text(): Promise<string>;
  }

  export interface ScreenshotOptions {
    path?: string;
    type?: 'jpeg' | 'png';
    quality?: number;
    fullPage?: boolean;
    clip?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }

  export function launch(options?: {
    headless?: boolean;
    executablePath?: string;
    args?: string[];
  }): Promise<Browser>;
} 
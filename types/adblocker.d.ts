declare module '@cliqz/adblocker' {
  export class FiltersEngine {
    static fromPrebuiltAdsAndTracking(): Promise<FiltersEngine>;
    enableBlockingInBrowser(): void;
    disableBlockingInBrowser(): void;
  }
} 
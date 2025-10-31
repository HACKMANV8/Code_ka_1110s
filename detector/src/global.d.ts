export {};

declare global {
  interface Window {
    detectorAPI?: {
      startMonitoring: () => Promise<any>;
      getServerStatus: () => Promise<any>;
    };
  }
}

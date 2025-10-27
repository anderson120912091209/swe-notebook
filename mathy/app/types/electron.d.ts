// Electron API types for renderer process
declare global {
  interface Window {
    electronAPI: {
      // Menu actions
      onMenuAction: (callback: (action: string, data?: any) => void) => void;
      
      // File operations
      showOpenDialog: () => Promise<any>;
      showSaveDialog: () => Promise<any>;
      
      // App info
      getVersion: () => Promise<string>;
      getPlatform: () => string;
      
      // Window controls
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
    };
  }
}

export {};

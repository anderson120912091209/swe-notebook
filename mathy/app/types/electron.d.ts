// Electron API types for renderer process
declare global {
  interface Window {
    electronAPI: {
      // Menu actions
      onMenuAction: (callback: (action: string, data?: Record<string, unknown>) => void) => void;
      
      // File operations
      showOpenDialog: () => Promise<{ canceled: boolean; filePaths?: string[] }>;
      showSaveDialog: () => Promise<{ canceled: boolean; filePath?: string }>;
      
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

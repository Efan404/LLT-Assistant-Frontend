/**
 * Global Configuration Constants for LLT Assistant
 *
 * Single source of truth for all configuration defaults
 */

export const GLOBAL_CONFIG = {
  // Extension identifier
  EXTENSION_ID: 'llt-assistant',

  // Backend API URLs
  BACKEND: {
    // Main backend URL (used for test generation, impact analysis, coverage, etc.)
    URL: 'https://cs5351.efan.dev',
  },

  // Configuration section names
  SECTIONS: {
    MAIN: 'llt-assistant',
    QUALITY: 'llt-assistant.quality',
    COVERAGE: 'llt-assistant.coverage',
    IMPACT: 'llt-assistant.impact',
  },
} as const;

/**
 * Backend URL utilities
 */
export class BackendUrlConfig {
  /**
   * Get the main backend URL for any feature
   */
  static getBackendUrl(): string {
    try {
      const vscode = require('vscode');
      const config = vscode.workspace.getConfiguration(GLOBAL_CONFIG.SECTIONS.MAIN);
      return config.get('backendUrl', GLOBAL_CONFIG.BACKEND.URL);
    } catch (error) {
      // Fallback if vscode is not available (e.g., in tests)
      return GLOBAL_CONFIG.BACKEND.URL;
    }
  }

  /**
   * Get the full backend API base URL
   * Note: /api/v1 path has been removed from backend, so this now returns the base URL directly
   */
  static getFullApiUrl(): string {
    return this.getBackendUrl();
  }
}

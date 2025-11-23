import * as vscode from 'vscode';
import { BackendUrlConfig } from '../utils/config';

/**
 * Manages plugin configuration for backend API
 */
export class ConfigurationManager {
  private readonly configSection = 'llt-assistant';

  /**
   * Get the configured backend URL from unified configuration
   * @returns Backend API URL
   */
  public getBackendUrl(): string {
    return BackendUrlConfig.getBackendUrl();
  }

  /**
   * Validate current configuration
   * @returns Object with validation result
   */
  public validateConfiguration(): { valid: boolean; errors: string[] } {
    const backendUrl = this.getBackendUrl();
    const errors: string[] = [];

    if (!backendUrl || backendUrl.trim() === '') {
      errors.push('Backend URL not configured');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

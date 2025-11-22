/**
 * Maintenance Backend Client
 * Handles communication with the backend API for maintenance operations
 */

import * as vscode from 'vscode';
import axios, { AxiosError, AxiosInstance } from 'axios';
import {
	AnalyzeMaintenanceRequest,
	AnalyzeMaintenanceResponse,
	BatchFixRequest,
	BatchFixResponse,
	GetCodeDiffRequest,
	GetCodeDiffResponse,
	BackendError,
	BackendErrorType,
	HealthCheckResponse
} from './types';

/**
 * Maintenance Backend Client
 */
export class MaintenanceBackendClient {
	private axiosInstance: AxiosInstance;
	private backendUrl: string;

	constructor() {
		this.backendUrl = this.getBackendUrl();
		this.axiosInstance = axios.create({
			baseURL: this.backendUrl,
			timeout: 60000, // 60 seconds for maintenance operations
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	/**
	 * Get backend URL from configuration
	 */
	private getBackendUrl(): string {
		const config = vscode.workspace.getConfiguration('llt-assistant');
		// Use maintenance-specific URL if configured, otherwise fall back to main backend URL
		const mainBackendUrl = config.get<string>('backendUrl', 'https://cs5351.efan.dev');
		// Ensure main backend URL has /api/v1 suffix if not present
		const normalizedMainUrl = mainBackendUrl.endsWith('/api/v1') 
			? mainBackendUrl 
			: mainBackendUrl.endsWith('/') 
				? `${mainBackendUrl}api/v1`
				: `${mainBackendUrl}/api/v1`;
		
		return (
			config.get('maintenance.backendUrl') ||
			normalizedMainUrl
		);
	}

	/**
	 * Update backend URL when configuration changes
	 */
	updateBackendUrl(): void {
		this.backendUrl = this.getBackendUrl();
		this.axiosInstance = axios.create({
			baseURL: this.backendUrl,
			timeout: 60000,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	/**
	 * Get client metadata for tracking
	 */
	private getClientMetadata() {
		return {
			extension_version:
				vscode.extensions.getExtension('llt-assistant')?.packageJSON?.version || '0.0.1',
			vscode_version: vscode.version,
			platform: process.platform,
			workspace_hash:
				vscode.workspace.workspaceFolders?.[0]?.uri.fsPath.substring(0, 8) || 'unknown'
		};
	}

	/**
	 * Check backend health
	 */
	async checkHealth(): Promise<boolean> {
		try {
			const response = await this.axiosInstance.get<HealthCheckResponse>('/health');
			return response.data.status === 'ok' || response.data.status === 'healthy';
		} catch (error) {
			console.error('[Maintenance] Health check failed:', error);
			return false;
		}
	}

	/**
	 * Analyze maintenance - identify affected test cases
	 */
	async analyzeMaintenance(
		request: AnalyzeMaintenanceRequest
	): Promise<AnalyzeMaintenanceResponse> {
		try {
			// Add client metadata
			request.client_metadata = this.getClientMetadata();

			// Make API call
			const response = await this.axiosInstance.post<AnalyzeMaintenanceResponse>(
				'/maintenance/analyze',
				request
			);

			return response.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Batch fix tests - regenerate or improve coverage
	 */
	async batchFixTests(request: BatchFixRequest): Promise<BatchFixResponse> {
		try {
			// Add client metadata
			request.client_metadata = this.getClientMetadata();

			// Make API call
			const response = await this.axiosInstance.post<BatchFixResponse>(
				'/maintenance/batch-fix',
				request
			);

			return response.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Get code diff details
	 */
	async getCodeDiff(request: GetCodeDiffRequest): Promise<GetCodeDiffResponse> {
		try {
			// Make API call
			const response = await this.axiosInstance.post<GetCodeDiffResponse>(
				'/maintenance/code-diff',
				request
			);

			return response.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Handle API errors
	 */
	private handleError(error: unknown): BackendError {
		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError;

			// Network errors
			if (!axiosError.response) {
				return {
					type: 'network' as BackendErrorType,
					message: 'Cannot connect to LLT backend',
					detail: axiosError.message,
					statusCode: 0
				};
			}

			// Timeout errors
			if (axiosError.code === 'ECONNABORTED') {
				return {
					type: 'timeout' as BackendErrorType,
					message: 'Backend request timed out',
					detail: 'The server took too long to respond',
					statusCode: 0
				};
			}

			// HTTP errors
			const statusCode = axiosError.response.status;

			if (statusCode >= 400 && statusCode < 500) {
				// Client errors (validation, etc.)
				return {
					type: 'validation' as BackendErrorType,
					message: 'Invalid request',
					detail: JSON.stringify(axiosError.response.data) || axiosError.message,
					statusCode
				};
			}

			if (statusCode >= 500) {
				// Server errors
				return {
					type: 'server' as BackendErrorType,
					message: 'Backend server error',
					detail: JSON.stringify(axiosError.response.data) || axiosError.message,
					statusCode
				};
			}

			// Other HTTP errors
			return {
				type: 'http' as BackendErrorType,
				message: `HTTP error ${statusCode}`,
				detail: axiosError.message,
				statusCode
			};
		}

		// Unknown errors
		return {
			type: 'unknown' as BackendErrorType,
			message: 'Unknown error occurred',
			detail: error instanceof Error ? error.message : String(error),
			statusCode: 0
		};
	}
}


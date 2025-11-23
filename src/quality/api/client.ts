/**
 * Backend API Client for Quality Analysis (Feature 4)
 *
 * Handles communication with POST /quality/analyze endpoint.
 * Features:
 * - File chunking for large batch requests
 * - Exponential backoff retry logic
 * - Error classification and handling
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as vscode from 'vscode';
import {
	QualityAnalysisRequest,
	QualityAnalysisResponse,
	QualityIssue,
	AnalysisMode,
	BackendError,
	HealthCheckResponse
} from './types';
import { BackendUrlConfig } from '../../utils/config';
import { QUALITY_DEFAULTS } from '../utils/constants';

/** Maximum files per request to avoid timeout */
const MAX_FILES_PER_CHUNK = 10;

export class QualityBackendClient {
	private client: AxiosInstance;
	private baseUrl: string;

	constructor() {
		this.baseUrl = this.getBackendUrl();
		this.client = axios.create({
			baseURL: this.baseUrl,
			timeout: 30000,
			headers: {
				'Content-Type': 'application/json'
			}
		});

		this.setupInterceptors();
	}

	/**
	 * Get backend URL from unified configuration.
	 */
	private getBackendUrl(): string {
		return BackendUrlConfig.getBackendUrl();
	}

	/**
	 * Setup request/response interceptors for logging.
	 */
	private setupInterceptors(): void {
		this.client.interceptors.request.use(
			(config) => {
				console.log(`[Quality API] ${config.method?.toUpperCase()} ${config.url}`);
				return config;
			},
			(error) => Promise.reject(error)
		);

		this.client.interceptors.response.use(
			(response) => {
				console.log(`[Quality API] Response: ${response.status}`);
				return response;
			},
			(error) => Promise.reject(this.classifyError(error))
		);
	}

	/**
	 * Analyze files for quality issues.
	 *
	 * Automatically chunks large requests to avoid timeouts.
	 * Results from all chunks are merged into a single response.
	 *
	 * @param request - Analysis request with files and mode
	 * @returns Merged analysis response
	 */
	async analyzeQuality(request: QualityAnalysisRequest): Promise<QualityAnalysisResponse> {
		const { files, mode = 'hybrid' } = request;

		// Small batch: single request
		if (files.length <= MAX_FILES_PER_CHUNK) {
			return this.executeWithRetry(request);
		}

		// Large batch: chunk and merge
		return this.analyzeInChunks(files, mode);
	}

	/**
	 * Split large file list into chunks and merge results.
	 */
	private async analyzeInChunks(
		files: QualityAnalysisRequest['files'],
		mode: AnalysisMode
	): Promise<QualityAnalysisResponse> {
		const chunks: QualityAnalysisRequest['files'][] = [];

		for (let i = 0; i < files.length; i += MAX_FILES_PER_CHUNK) {
			chunks.push(files.slice(i, i + MAX_FILES_PER_CHUNK));
		}

		console.log(`[Quality API] Splitting ${files.length} files into ${chunks.length} chunks`);

		// Execute chunks sequentially to avoid overwhelming the backend
		const results: QualityAnalysisResponse[] = [];
		for (const chunk of chunks) {
			const result = await this.executeWithRetry({ files: chunk, mode });
			results.push(result);
		}

		// Merge all results
		return this.mergeResponses(results);
	}

	/**
	 * Merge multiple chunk responses into a single response.
	 */
	private mergeResponses(responses: QualityAnalysisResponse[]): QualityAnalysisResponse {
		const allIssues: QualityIssue[] = [];
		let totalCritical = 0;

		for (const response of responses) {
			allIssues.push(...response.issues);
			totalCritical += response.summary.critical_issues;
		}

		return {
			analysis_id: responses[0]?.analysis_id || 'merged',
			summary: {
				total_files: responses.reduce((sum, r) => sum + (r.summary.total_files || 0), 0),
				total_issues: allIssues.length,
				critical_issues: totalCritical
			},
			issues: allIssues
		};
	}

	/**
	 * Execute request with exponential backoff retry.
	 */
	private async executeWithRetry(request: QualityAnalysisRequest): Promise<QualityAnalysisResponse> {
		const maxRetries = QUALITY_DEFAULTS.RETRY_MAX_ATTEMPTS;
		let lastError: BackendError | null = null;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				const response = await this.client.post<QualityAnalysisResponse>(
					'/quality/analyze',
					request
				);
				return response.data;
			} catch (error) {
				lastError = error as BackendError;

				if (!this.isRetryable(lastError) || attempt === maxRetries - 1) {
					break;
				}

				const delayMs = Math.pow(2, attempt) * QUALITY_DEFAULTS.RETRY_BASE_DELAY_MS;
				console.log(`[Quality API] Retry ${attempt + 1}/${maxRetries} after ${delayMs}ms`);
				await this.delay(delayMs);
			}
		}

		throw lastError;
	}

	/**
	 * Health check endpoint.
	 */
	async healthCheck(): Promise<boolean> {
		try {
			const response = await this.client.get<HealthCheckResponse>('/health');
			return response.status === 200 && response.data.status === 'healthy';
		} catch {
			return false;
		}
	}

	/**
	 * Update backend URL when configuration changes.
	 */
	public updateBackendUrl(): void {
		const newUrl = this.getBackendUrl();
		if (newUrl !== this.baseUrl) {
			this.baseUrl = newUrl;
			this.client.defaults.baseURL = newUrl;
			console.log(`[Quality API] Backend URL updated: ${newUrl}`);
		}
	}

	/**
	 * Classify axios errors into structured BackendError.
	 */
	private classifyError(error: unknown): BackendError {
		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError;

			// Network error
			if (!axiosError.response) {
				return {
					type: 'network',
					message: 'Cannot connect to backend',
					detail: `Please check if backend is running at ${this.baseUrl}`,
					statusCode: 0
				};
			}

			const status = axiosError.response.status;
			const data = axiosError.response.data as Record<string, unknown>;

			// Validation error
			if (status === 400 || status === 422) {
				return {
					type: 'validation',
					message: 'Invalid request',
					detail: this.extractErrorDetail(data),
					statusCode: status
				};
			}

			// Server error
			if (status >= 500) {
				return {
					type: 'server',
					message: 'Backend server error',
					detail: this.extractErrorDetail(data),
					statusCode: status
				};
			}

			// Generic HTTP error
			return {
				type: 'http',
				message: `HTTP ${status} error`,
				detail: this.extractErrorDetail(data),
				statusCode: status
			};
		}

		// Timeout
		if ((error as { code?: string }).code === 'ECONNABORTED') {
			return {
				type: 'timeout',
				message: 'Request timeout',
				detail: 'Backend took too long to respond',
				statusCode: 0
			};
		}

		// Unknown
		return {
			type: 'unknown',
			message: 'Unknown error',
			detail: String(error),
			statusCode: 0
		};
	}

	/**
	 * Extract error detail from response data.
	 */
	private extractErrorDetail(data: Record<string, unknown>): string {
		if (data?.error && typeof data.error === 'string') {
			return data.error;
		}
		if (data?.detail && typeof data.detail === 'string') {
			return data.detail;
		}
		if (data?.details && typeof data.details === 'object') {
			return JSON.stringify(data.details);
		}
		return 'Unknown error';
	}

	/**
	 * Check if error is retryable.
	 */
	private isRetryable(error: BackendError): boolean {
		return error.type === 'network' ||
			error.type === 'server' ||
			error.type === 'timeout' ||
			error.statusCode === 429;
	}

	/**
	 * Delay helper for retry backoff.
	 */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

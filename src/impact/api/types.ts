/**
 * Backend API Types for Impact Analysis
 * Based on the /workflows/detect-code-changes endpoint specification
 */

import { AffectedTest, ChangeSummary } from '../models/types';

/**
 * Code changes input for detection
 */
export interface CodeChangesInput {
	old_code: string;
	new_code: string;
	file_path: string;
}

/**
 * Client metadata for tracking
 */
export interface ClientMetadata {
	extension_version?: string;
	vscode_version?: string;
	platform?: string;
	workspace_hash?: string;
}

/**
 * Request payload for detect-code-changes endpoint
 */
export interface DetectCodeChangesRequest {
	changes: CodeChangesInput;
	previous_tests: string;
	client_metadata?: ClientMetadata;
}

/**
 * Response from detect-code-changes endpoint
 */
export interface DetectCodeChangesResponse {
	context_id: string;
	affected_tests: AffectedTest[];
	change_summary: ChangeSummary;
}

/**
 * Backend error types
 */
export type BackendErrorType =
	| 'network'
	| 'validation'
	| 'server'
	| 'http'
	| 'timeout'
	| 'unknown';

/**
 * Backend error
 */
export interface BackendError {
	type: BackendErrorType;
	message: string;
	detail: string;
	statusCode: number;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
	status: string;
	version?: string;
}

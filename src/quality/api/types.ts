/**
 * API Types for Quality Analysis (Feature 4)
 *
 * Based on OpenAPI spec for POST /quality/analyze endpoint.
 * These types are designed to work with VSCode's DiagnosticCollection
 * and CodeActionProvider APIs.
 */

// ============================================================================
// Request Types
// ============================================================================

/**
 * File input for quality analysis.
 * Content should be the editor's dirty content, not the saved file.
 */
export interface FileInput {
	path: string;
	content: string;
}

/**
 * Analysis mode selection.
 * - fast: Rules only (recommended for on-save triggers)
 * - deep: LLM only
 * - hybrid: Rules + LLM (recommended default for button triggers)
 */
export type AnalysisMode = 'fast' | 'deep' | 'hybrid';

/**
 * Quality analysis request payload.
 */
export interface QualityAnalysisRequest {
	files: FileInput[];
	mode?: AnalysisMode;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Issue severity level.
 * Maps to VSCode DiagnosticSeverity:
 * - error -> DiagnosticSeverity.Error (red squiggly)
 * - warning -> DiagnosticSeverity.Warning (yellow squiggly)
 * - info -> DiagnosticSeverity.Information (blue dotted)
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * Detection source for the issue.
 */
export type DetectedBy = 'rule' | 'llm';

/**
 * Fix suggestion type.
 * - delete: Remove the problematic code
 * - replace: Replace with new_text
 * - insert: Insert new_text at the location
 */
export type FixSuggestionType = 'delete' | 'replace' | 'insert';

/**
 * Embedded fix suggestion.
 * Pre-loaded in response to enable zero-latency quick fixes.
 */
export interface FixSuggestion {
	type: FixSuggestionType;
	new_text: string;
	description: string;
}

/**
 * Quality issue detected in analysis.
 *
 * Note: Backend returns 1-based line numbers.
 * Frontend must convert to 0-based for VSCode APIs.
 */
export interface QualityIssue {
	file_path: string;
	line: number;        // 1-based from backend
	column: number;      // 0-based
	severity: IssueSeverity;
	code: string;        // Issue code (e.g., "redundant-assertion")
	message: string;
	detected_by: DetectedBy;
	suggestion: FixSuggestion | null;
}

/**
 * Analysis summary statistics.
 */
export interface AnalysisSummary {
	total_files?: number;
	total_issues: number;
	critical_issues: number;
}

/**
 * Quality analysis response payload.
 */
export interface QualityAnalysisResponse {
	analysis_id: string;
	summary: AnalysisSummary;
	issues: QualityIssue[];
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Backend error classification.
 */
export type BackendErrorType =
	| 'network'
	| 'validation'
	| 'server'
	| 'http'
	| 'timeout'
	| 'unknown';

/**
 * Structured backend error for user-friendly messaging.
 */
export interface BackendError {
	type: BackendErrorType;
	message: string;
	detail: string;
	statusCode: number;
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Health check response.
 */
export interface HealthCheckResponse {
	status: 'healthy' | 'degraded';
	version?: string;
}

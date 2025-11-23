/**
 * Constants for Quality Analysis Feature (Feature 4)
 */

export const QUALITY_DEFAULTS = {
	/** Default analysis mode: fast | deep | hybrid */
	ANALYSIS_MODE: 'hybrid' as const,

	/** Auto-analyze on file save (uses 'fast' mode) */
	AUTO_ANALYZE: false,

	/** Show inline squiggly decorations */
	ENABLE_INLINE_DECORATIONS: true,

	/** Enable quick fix code actions */
	ENABLE_CODE_ACTIONS: true,

	/** Severity levels to display */
	SEVERITY_FILTER: ['error', 'warning', 'info'] as const,

	/** API retry configuration */
	RETRY_MAX_ATTEMPTS: 3,
	RETRY_BASE_DELAY_MS: 1000,

	/** Debounce delay for auto-analyze (ms) */
	AUTO_ANALYZE_DEBOUNCE_MS: 1000
};

export const EXTENSION_NAME = 'llt-assistant';
export const QUALITY_DIAGNOSTIC_SOURCE = 'LLT Quality';

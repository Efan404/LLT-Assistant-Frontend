/**
 * Configuration Manager for Quality Analysis (Feature 4)
 */

import * as vscode from 'vscode';
import { AnalysisMode, IssueSeverity } from '../api/types';
import { QUALITY_DEFAULTS } from './constants';

export class QualityConfigManager {
	private static readonly SECTION = 'llt-assistant.quality';

	/**
	 * Get backend URL.
	 */
	static getBackendUrl(): string {
		return this.get<string>('backendUrl', QUALITY_DEFAULTS.BACKEND_URL);
	}

	/**
	 * Get analysis mode.
	 */
	static getAnalysisMode(): AnalysisMode {
		return this.get<AnalysisMode>('analysisMode', QUALITY_DEFAULTS.ANALYSIS_MODE);
	}

	/**
	 * Get auto-analyze on save setting.
	 */
	static getAutoAnalyze(): boolean {
		return this.get<boolean>('autoAnalyze', QUALITY_DEFAULTS.AUTO_ANALYZE);
	}

	/**
	 * Get inline decorations setting.
	 */
	static getEnableInlineDecorations(): boolean {
		return this.get<boolean>('enableInlineDecorations', QUALITY_DEFAULTS.ENABLE_INLINE_DECORATIONS);
	}

	/**
	 * Get code actions setting.
	 */
	static getEnableCodeActions(): boolean {
		return this.get<boolean>('enableCodeActions', QUALITY_DEFAULTS.ENABLE_CODE_ACTIONS);
	}

	/**
	 * Get severity filter.
	 */
	static getSeverityFilter(): IssueSeverity[] {
		return this.get<IssueSeverity[]>('severityFilter', [...QUALITY_DEFAULTS.SEVERITY_FILTER]);
	}

	/**
	 * Get auto-analyze debounce delay in milliseconds.
	 */
	static getAutoAnalyzeDebounceMs(): number {
		return QUALITY_DEFAULTS.AUTO_ANALYZE_DEBOUNCE_MS;
	}

	/**
	 * Generic get method.
	 */
	private static get<T>(key: string, defaultValue: T): T {
		const config = vscode.workspace.getConfiguration(this.SECTION);
		return config.get<T>(key, defaultValue);
	}

	/**
	 * Watch for configuration changes.
	 */
	static onDidChange(
		callback: (e: vscode.ConfigurationChangeEvent) => void
	): vscode.Disposable {
		return vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration(this.SECTION)) {
				callback(e);
			}
		});
	}
}

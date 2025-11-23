/**
 * Diagnostic Manager for Quality Analysis (Feature 4)
 *
 * Manages VSCode DiagnosticCollection to show issues in:
 * - Problems panel (View -> Problems)
 * - Editor squiggly lines (via diagnostic decorations)
 *
 * Key responsibilities:
 * - Convert backend line numbers (1-based) to VSCode (0-based)
 * - Clear old diagnostics before setting new ones
 * - Group diagnostics by file URI
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { QualityIssue, IssueSeverity } from '../api/types';
import { QUALITY_DIAGNOSTIC_SOURCE } from '../utils/constants';

export class DiagnosticManager {
	private diagnosticCollection: vscode.DiagnosticCollection;

	constructor() {
		this.diagnosticCollection = vscode.languages.createDiagnosticCollection(QUALITY_DIAGNOSTIC_SOURCE);
	}

	/**
	 * Update diagnostics with new analysis results.
	 * Clears all previous diagnostics and sets new ones.
	 */
	public updateDiagnostics(issues: QualityIssue[]): void {
		// Clear all existing diagnostics
		this.diagnosticCollection.clear();

		// Group issues by file path
		const issuesByFile = this.groupByFile(issues);

		// Get workspace root for resolving relative paths
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		if (!workspaceRoot) {
			console.warn('[Quality] No workspace folder found');
			return;
		}

		// Create diagnostics for each file
		for (const [filePath, fileIssues] of issuesByFile.entries()) {
			const absolutePath = path.join(workspaceRoot, filePath);
			const uri = vscode.Uri.file(absolutePath);
			const diagnostics = fileIssues.map(issue => this.createDiagnostic(issue));
			this.diagnosticCollection.set(uri, diagnostics);
		}
	}

	/**
	 * Clear all diagnostics.
	 */
	public clear(): void {
		this.diagnosticCollection.clear();
	}

	/**
	 * Dispose the diagnostic collection.
	 */
	public dispose(): void {
		this.diagnosticCollection.dispose();
	}

	/**
	 * Group issues by file path.
	 */
	private groupByFile(issues: QualityIssue[]): Map<string, QualityIssue[]> {
		const map = new Map<string, QualityIssue[]>();

		for (const issue of issues) {
			const existing = map.get(issue.file_path);
			if (existing) {
				existing.push(issue);
			} else {
				map.set(issue.file_path, [issue]);
			}
		}

		return map;
	}

	/**
	 * Create a VSCode Diagnostic from a QualityIssue.
	 */
	private createDiagnostic(issue: QualityIssue): vscode.Diagnostic {
		// Convert 1-based line to 0-based
		const line = Math.max(0, issue.line - 1);
		const column = Math.max(0, issue.column);

		// Create range for the diagnostic
		// We use the full line for now, could be more precise with column info
		const range = new vscode.Range(
			new vscode.Position(line, column),
			new vscode.Position(line, Number.MAX_SAFE_INTEGER) // End of line
		);

		const diagnostic = new vscode.Diagnostic(
			range,
			issue.message,
			this.getSeverity(issue.severity)
		);

		diagnostic.source = QUALITY_DIAGNOSTIC_SOURCE;
		diagnostic.code = issue.code;

		// Add related information if we have a suggestion
		if (issue.suggestion) {
			diagnostic.tags = [];
			// Could add more metadata here if needed
		}

		return diagnostic;
	}

	/**
	 * Convert issue severity to VSCode DiagnosticSeverity.
	 */
	private getSeverity(severity: IssueSeverity): vscode.DiagnosticSeverity {
		switch (severity) {
			case 'error':
				return vscode.DiagnosticSeverity.Error;
			case 'warning':
				return vscode.DiagnosticSeverity.Warning;
			case 'info':
				return vscode.DiagnosticSeverity.Information;
		}
	}
}

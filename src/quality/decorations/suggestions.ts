/**
 * Code Action Provider for Quick Fixes (Feature 4)
 *
 * Provides zero-latency quick fix actions (lightbulb) for quality issues.
 * Uses pre-loaded suggestions from analysis response - no network requests needed.
 *
 * Supports three fix types:
 * - delete: Remove problematic code
 * - replace: Replace with suggested code
 * - insert: Insert suggested code
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { QualityIssue, IssueSeverity } from '../api/types';
import { QUALITY_DIAGNOSTIC_SOURCE } from '../utils/constants';

export class QualitySuggestionProvider implements vscode.CodeActionProvider {
	private issuesByFile = new Map<string, QualityIssue[]>();

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	/**
	 * Update issues for suggestion generation.
	 */
	public updateIssues(issues: QualityIssue[]): void {
		this.issuesByFile.clear();

		for (const issue of issues) {
			const existing = this.issuesByFile.get(issue.file_path);
			if (existing) {
				existing.push(issue);
			} else {
				this.issuesByFile.set(issue.file_path, [issue]);
			}
		}
	}

	/**
	 * Clear all issues.
	 */
	public clear(): void {
		this.issuesByFile.clear();
	}

	/**
	 * Provide code actions for a given document and range.
	 * Called by VSCode when user clicks lightbulb or uses Cmd+. / Ctrl+.
	 *
	 * This method reads from memory cache - no network requests.
	 */
	public provideCodeActions(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection,
		_context: vscode.CodeActionContext,
		_token: vscode.CancellationToken
	): vscode.CodeAction[] | undefined {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		if (!workspaceRoot) {
			return;
		}

		const relativePath = path.relative(workspaceRoot, document.uri.fsPath)
			.replace(/\\/g, '/');

		const issues = this.issuesByFile.get(relativePath) || [];

		// Find issues that intersect with the cursor position
		const relevantIssues = issues.filter(issue => {
			const issueLine = issue.line - 1; // Convert to 0-based
			return range.start.line <= issueLine && issueLine <= range.end.line;
		});

		if (relevantIssues.length === 0) {
			return;
		}

		// Create code actions for each issue
		const actions: vscode.CodeAction[] = [];

		for (const issue of relevantIssues) {
			const action = this.createCodeAction(document, issue);
			if (action) {
				actions.push(action);
			}
		}

		return actions;
	}

	/**
	 * Create a code action for a specific issue.
	 */
	private createCodeAction(
		document: vscode.TextDocument,
		issue: QualityIssue
	): vscode.CodeAction | undefined {
		const suggestion = issue.suggestion;

		if (!suggestion) {
			return;
		}

		switch (suggestion.type) {
			case 'delete':
				return this.createDeleteAction(document, issue);
			case 'replace':
				return this.createReplaceAction(document, issue);
			case 'insert':
				return this.createInsertAction(document, issue);
			default:
				return;
		}
	}

	/**
	 * Create a "Delete" code action.
	 */
	private createDeleteAction(
		document: vscode.TextDocument,
		issue: QualityIssue
	): vscode.CodeAction | undefined {
		const line = issue.line - 1;
		if (line >= document.lineCount) {
			return;
		}

		const action = new vscode.CodeAction(
			issue.suggestion!.description || `Fix: Remove ${this.formatCode(issue.code)}`,
			vscode.CodeActionKind.QuickFix
		);

		action.edit = new vscode.WorkspaceEdit();

		// Delete the entire line including line break
		const lineRange = document.lineAt(line).rangeIncludingLineBreak;
		action.edit.delete(document.uri, lineRange);

		action.diagnostics = [this.createDiagnostic(document, issue)];
		action.isPreferred = issue.detected_by === 'rule';

		return action;
	}

	/**
	 * Create a "Replace" code action.
	 */
	private createReplaceAction(
		document: vscode.TextDocument,
		issue: QualityIssue
	): vscode.CodeAction | undefined {
		const line = issue.line - 1;
		const newText = issue.suggestion?.new_text;

		if (line >= document.lineCount || !newText) {
			return;
		}

		const action = new vscode.CodeAction(
			issue.suggestion!.description || `Fix: ${this.formatCode(issue.code)}`,
			vscode.CodeActionKind.QuickFix
		);

		action.edit = new vscode.WorkspaceEdit();

		const lineText = document.lineAt(line).text;
		const lineRange = document.lineAt(line).range;

		// Preserve original indentation
		const indentation = lineText.match(/^\s*/)?.[0] || '';
		const newTextWithIndent = newText.startsWith(indentation)
			? newText
			: indentation + newText.trim();

		action.edit.replace(document.uri, lineRange, newTextWithIndent);

		action.diagnostics = [this.createDiagnostic(document, issue)];
		action.isPreferred = issue.detected_by === 'rule';

		return action;
	}

	/**
	 * Create an "Insert" code action.
	 */
	private createInsertAction(
		document: vscode.TextDocument,
		issue: QualityIssue
	): vscode.CodeAction | undefined {
		const line = issue.line - 1;
		const newText = issue.suggestion?.new_text;

		if (line >= document.lineCount || !newText) {
			return;
		}

		const action = new vscode.CodeAction(
			issue.suggestion!.description || `Fix: Add ${this.formatCode(issue.code)}`,
			vscode.CodeActionKind.QuickFix
		);

		action.edit = new vscode.WorkspaceEdit();

		const lineText = document.lineAt(line).text;
		const indentation = lineText.match(/^\s*/)?.[0] || '';
		const newTextWithIndent = indentation + newText.trim() + '\n';

		// Insert after the current line
		const insertPosition = new vscode.Position(line + 1, 0);
		action.edit.insert(document.uri, insertPosition, newTextWithIndent);

		action.diagnostics = [this.createDiagnostic(document, issue)];
		action.isPreferred = false; // Adding code is more risky

		return action;
	}

	/**
	 * Create a diagnostic for the issue.
	 */
	private createDiagnostic(
		document: vscode.TextDocument,
		issue: QualityIssue
	): vscode.Diagnostic {
		const line = issue.line - 1;

		if (line >= document.lineCount) {
			const diagnostic = new vscode.Diagnostic(
				new vscode.Range(0, 0, 0, 0),
				issue.message,
				vscode.DiagnosticSeverity.Warning
			);
			diagnostic.source = QUALITY_DIAGNOSTIC_SOURCE;
			return diagnostic;
		}

		const lineText = document.lineAt(line).text;
		const startChar = Math.max(0, issue.column > 0 ? issue.column : lineText.search(/\S/));

		const range = new vscode.Range(
			new vscode.Position(line, startChar),
			new vscode.Position(line, lineText.length)
		);

		const diagnostic = new vscode.Diagnostic(
			range,
			issue.message,
			this.getSeverity(issue.severity)
		);

		diagnostic.source = QUALITY_DIAGNOSTIC_SOURCE;
		diagnostic.code = issue.code;

		return diagnostic;
	}

	/**
	 * Convert issue severity to VSCode diagnostic severity.
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

	/**
	 * Format issue code for display.
	 */
	private formatCode(code: string): string {
		return code
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
}

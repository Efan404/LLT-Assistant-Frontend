/**
 * Inline Issue Decorations (Feature 4)
 *
 * Highlights quality issues directly in the code editor with squiggly lines:
 * - Error: Red wavy underline
 * - Warning: Yellow underline
 * - Info: Blue dotted underline
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { QualityIssue } from '../api/types';

export class IssueDecorator {
	private errorDecorationType: vscode.TextEditorDecorationType;
	private warningDecorationType: vscode.TextEditorDecorationType;
	private infoDecorationType: vscode.TextEditorDecorationType;

	private issuesByFile = new Map<string, QualityIssue[]>();

	constructor() {
		this.errorDecorationType = vscode.window.createTextEditorDecorationType({
			textDecoration: 'underline wavy',
			borderWidth: '0 0 2px 0',
			borderStyle: 'solid',
			borderColor: new vscode.ThemeColor('editorError.foreground'),
			overviewRulerColor: new vscode.ThemeColor('editorError.foreground'),
			overviewRulerLane: vscode.OverviewRulerLane.Right
		});

		this.warningDecorationType = vscode.window.createTextEditorDecorationType({
			textDecoration: 'underline',
			borderWidth: '0 0 2px 0',
			borderStyle: 'solid',
			borderColor: new vscode.ThemeColor('editorWarning.foreground'),
			overviewRulerColor: new vscode.ThemeColor('editorWarning.foreground'),
			overviewRulerLane: vscode.OverviewRulerLane.Right
		});

		this.infoDecorationType = vscode.window.createTextEditorDecorationType({
			textDecoration: 'underline dotted',
			borderWidth: '0 0 1px 0',
			borderStyle: 'dotted',
			borderColor: new vscode.ThemeColor('editorInfo.foreground'),
			overviewRulerColor: new vscode.ThemeColor('editorInfo.foreground'),
			overviewRulerLane: vscode.OverviewRulerLane.Right
		});
	}

	/**
	 * Update decorations with new analysis results.
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

		// Update all visible editors
		for (const editor of vscode.window.visibleTextEditors) {
			this.updateEditorDecorations(editor);
		}
	}

	/**
	 * Clear all decorations.
	 */
	public clear(): void {
		this.issuesByFile.clear();
		for (const editor of vscode.window.visibleTextEditors) {
			editor.setDecorations(this.errorDecorationType, []);
			editor.setDecorations(this.warningDecorationType, []);
			editor.setDecorations(this.infoDecorationType, []);
		}
	}

	/**
	 * Update decorations for a specific editor.
	 */
	public updateEditorDecorations(editor: vscode.TextEditor): void {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		if (!workspaceRoot) {
			return;
		}

		const relativePath = path.relative(workspaceRoot, editor.document.uri.fsPath)
			.replace(/\\/g, '/');

		const issues = this.issuesByFile.get(relativePath) || [];

		const errorDecorations: vscode.DecorationOptions[] = [];
		const warningDecorations: vscode.DecorationOptions[] = [];
		const infoDecorations: vscode.DecorationOptions[] = [];

		for (const issue of issues) {
			const decoration = this.createDecoration(editor.document, issue);

			switch (issue.severity) {
				case 'error':
					errorDecorations.push(decoration);
					break;
				case 'warning':
					warningDecorations.push(decoration);
					break;
				case 'info':
					infoDecorations.push(decoration);
					break;
			}
		}

		editor.setDecorations(this.errorDecorationType, errorDecorations);
		editor.setDecorations(this.warningDecorationType, warningDecorations);
		editor.setDecorations(this.infoDecorationType, infoDecorations);
	}

	/**
	 * Create a decoration for a single issue.
	 */
	private createDecoration(
		document: vscode.TextDocument,
		issue: QualityIssue
	): vscode.DecorationOptions {
		// Convert 1-based line to 0-based
		const line = Math.max(0, issue.line - 1);

		if (line >= document.lineCount) {
			return { range: new vscode.Range(0, 0, 0, 0), hoverMessage: '' };
		}

		const lineText = document.lineAt(line).text;
		const startChar = Math.max(0, issue.column > 0 ? issue.column : lineText.search(/\S/));
		const endChar = lineText.length;

		const range = new vscode.Range(
			new vscode.Position(line, startChar),
			new vscode.Position(line, endChar)
		);

		// Create hover message
		const hoverMessage = new vscode.MarkdownString();
		hoverMessage.appendMarkdown(`**${this.formatCode(issue.code)}**\n\n`);
		hoverMessage.appendMarkdown(`${issue.message}\n\n`);
		hoverMessage.appendMarkdown(`*Detected by: ${issue.detected_by === 'llm' ? 'AI' : 'Rule'}*\n\n`);

		if (issue.suggestion) {
			hoverMessage.appendMarkdown(`**Suggestion:** ${issue.suggestion.description}\n\n`);
			if (issue.suggestion.new_text && issue.suggestion.type !== 'delete') {
				hoverMessage.appendCodeblock(issue.suggestion.new_text, 'python');
			}
		}

		return { range, hoverMessage };
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

	/**
	 * Dispose all decoration types.
	 */
	public dispose(): void {
		this.errorDecorationType.dispose();
		this.warningDecorationType.dispose();
		this.infoDecorationType.dispose();
	}
}

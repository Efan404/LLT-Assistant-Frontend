/**
 * Tree View Data Provider for Quality Analysis Results (Feature 4)
 *
 * Displays quality issues in a hierarchical tree view:
 * - Summary node with statistics
 * - File nodes grouped by path
 * - Issue nodes with severity indicators
 */

import * as vscode from 'vscode';
import { QualityAnalysisResponse, QualityIssue, IssueSeverity } from '../api/types';
import { TreeItemType, QualityTreeItem } from './types';
import { QualityConfigManager } from '../utils/config';

export class QualityTreeProvider implements vscode.TreeDataProvider<QualityTreeItem> {
	private _onDidChangeTreeData = new vscode.EventEmitter<QualityTreeItem | undefined>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	private analysisResult: QualityAnalysisResponse | null = null;

	/**
	 * Refresh the tree view with new analysis results.
	 */
	public refresh(result: QualityAnalysisResponse): void {
		this.analysisResult = result;
		this._onDidChangeTreeData.fire(undefined);
	}

	/**
	 * Clear all issues from the tree view.
	 */
	public clear(): void {
		this.analysisResult = null;
		this._onDidChangeTreeData.fire(undefined);
	}

	/**
	 * Get current analysis result.
	 */
	public getAnalysisResult(): QualityAnalysisResponse | null {
		return this.analysisResult;
	}

	/**
	 * Get all issues (for external consumers like DiagnosticManager).
	 */
	public getIssues(): QualityIssue[] {
		return this.analysisResult?.issues || [];
	}

	getTreeItem(element: QualityTreeItem): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(element.label, element.collapsibleState);
		treeItem.description = element.description;
		treeItem.tooltip = element.tooltip;
		treeItem.iconPath = element.iconPath;
		treeItem.contextValue = element.contextValue;
		treeItem.command = element.command;
		return treeItem;
	}

	getChildren(element?: QualityTreeItem): QualityTreeItem[] {
		if (!this.analysisResult) {
			return [this.createEmptyStateItem()];
		}

		if (!element) {
			return this.getRootItems();
		}

		if (element.type === TreeItemType.File) {
			return this.getIssuesForFile(element.filePath!);
		}

		return [];
	}

	/**
	 * Get filtered issues based on severity filter.
	 */
	private getFilteredIssues(): QualityIssue[] {
		if (!this.analysisResult) {
			return [];
		}

		const severityFilter = QualityConfigManager.getSeverityFilter();
		if (severityFilter.length === 0) {
			return this.analysisResult.issues;
		}

		return this.analysisResult.issues.filter(issue =>
			severityFilter.includes(issue.severity)
		);
	}

	/**
	 * Get root level items (summary + files).
	 */
	private getRootItems(): QualityTreeItem[] {
		const items: QualityTreeItem[] = [this.createSummaryItem()];

		const fileMap = this.groupIssuesByFile();
		for (const [filePath, issues] of fileMap.entries()) {
			items.push(this.createFileItem(filePath, issues));
		}

		return items;
	}

	/**
	 * Create summary item.
	 */
	private createSummaryItem(): QualityTreeItem {
		const summary = this.analysisResult!.summary;
		const filteredIssues = this.getFilteredIssues();

		const tooltip = new vscode.MarkdownString();
		tooltip.appendMarkdown('**Quality Analysis Summary**\n\n');
		tooltip.appendMarkdown(`- Total Issues: ${summary.total_issues}\n`);
		tooltip.appendMarkdown(`- Critical: ${summary.critical_issues}\n`);
		if (summary.total_files) {
			tooltip.appendMarkdown(`- Files Analyzed: ${summary.total_files}\n`);
		}

		return {
			type: TreeItemType.Summary,
			label: 'Quality Overview',
			description: `${filteredIssues.length} issue${filteredIssues.length === 1 ? '' : 's'}`,
			tooltip,
			collapsibleState: vscode.TreeItemCollapsibleState.None,
			contextValue: 'summary',
			iconPath: new vscode.ThemeIcon('checklist')
		};
	}

	/**
	 * Create file item.
	 */
	private createFileItem(filePath: string, issues: QualityIssue[]): QualityTreeItem {
		const fileName = filePath.split('/').pop() || filePath;
		const criticalCount = issues.filter(i => i.severity === 'error').length;

		const tooltip = new vscode.MarkdownString();
		tooltip.appendMarkdown(`**${filePath}**\n\n`);
		tooltip.appendMarkdown(`- Issues: ${issues.length}\n`);
		tooltip.appendMarkdown(`- Critical: ${criticalCount}\n`);

		return {
			type: TreeItemType.File,
			label: fileName,
			description: `${issues.length} issue${issues.length === 1 ? '' : 's'}`,
			tooltip,
			collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
			contextValue: 'file',
			filePath,
			issueCount: issues.length,
			iconPath: new vscode.ThemeIcon('file-code')
		};
	}

	/**
	 * Create issue item.
	 */
	private createIssueItem(issue: QualityIssue): QualityTreeItem {
		const icon = this.getSeverityIcon(issue.severity);
		const codeLabel = this.formatCode(issue.code);

		const tooltip = new vscode.MarkdownString();
		tooltip.appendMarkdown(`**${codeLabel}**\n\n`);
		tooltip.appendMarkdown(`${issue.message}\n\n`);
		tooltip.appendMarkdown(`*Detected by: ${issue.detected_by === 'llm' ? 'AI' : 'Rule'}*\n`);
		if (issue.suggestion) {
			tooltip.appendMarkdown(`\n**Suggestion:** ${issue.suggestion.description}\n`);
		}

		return {
			type: TreeItemType.Issue,
			label: `Line ${issue.line}: ${codeLabel}`,
			description: issue.detected_by === 'llm' ? 'AI' : 'Rule',
			tooltip,
			collapsibleState: vscode.TreeItemCollapsibleState.None,
			contextValue: 'issue',
			issue,
			iconPath: icon,
			command: {
				command: 'llt-assistant.quality.showIssue',
				title: 'Show Issue',
				arguments: [issue]
			}
		};
	}

	/**
	 * Get icon for severity level.
	 */
	private getSeverityIcon(severity: IssueSeverity): vscode.ThemeIcon {
		switch (severity) {
			case 'error':
				return new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
			case 'warning':
				return new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
			case 'info':
				return new vscode.ThemeIcon('info', new vscode.ThemeColor('editorInfo.foreground'));
		}
	}

	/**
	 * Format issue code for display (e.g., "redundant-assertion" -> "Redundant Assertion").
	 */
	private formatCode(code: string): string {
		return code
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	/**
	 * Group issues by file path.
	 */
	private groupIssuesByFile(): Map<string, QualityIssue[]> {
		const fileMap = new Map<string, QualityIssue[]>();
		const filteredIssues = this.getFilteredIssues();

		for (const issue of filteredIssues) {
			const existing = fileMap.get(issue.file_path);
			if (existing) {
				existing.push(issue);
			} else {
				fileMap.set(issue.file_path, [issue]);
			}
		}

		return fileMap;
	}

	/**
	 * Get issues for a specific file.
	 */
	private getIssuesForFile(filePath: string): QualityTreeItem[] {
		const filteredIssues = this.getFilteredIssues();
		const issues = filteredIssues
			.filter(i => i.file_path === filePath)
			.sort((a, b) => a.line - b.line);

		return issues.map(issue => this.createIssueItem(issue));
	}

	/**
	 * Create empty state item.
	 */
	private createEmptyStateItem(): QualityTreeItem {
		return {
			type: TreeItemType.Empty,
			label: 'No analysis run yet',
			description: 'Click "Analyze Quality" to start',
			collapsibleState: vscode.TreeItemCollapsibleState.None,
			contextValue: 'empty',
			iconPath: new vscode.ThemeIcon('search')
		};
	}
}

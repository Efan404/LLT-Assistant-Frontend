/**
 * Analyze Quality Command (Feature 4)
 *
 * Scans test files and analyzes them for quality issues.
 * Uses dirty content from editors when available.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { QualityBackendClient, FileInput, QualityAnalysisRequest, QualityAnalysisResponse, BackendError } from '../api';
import { QualityTreeProvider } from '../activityBar';
import { QualityConfigManager } from '../utils';
import { AnalysisMode } from '../api/types';

export class AnalyzeQualityCommand {
	constructor(
		private backendClient: QualityBackendClient,
		private treeProvider: QualityTreeProvider,
		private onAnalysisComplete?: (result: QualityAnalysisResponse) => void
	) {}

	/**
	 * Main command handler for analyzing test quality.
	 *
	 * @param mode - Optional mode override (defaults to config setting)
	 */
	async execute(mode?: AnalysisMode): Promise<void> {
		try {
			await vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: 'Analyzing Quality',
					cancellable: true
				},
				async (progress, token) => {
					// Step 1: Find test files
					progress.report({ message: 'Finding test files...' });
					const testFiles = await this.findTestFiles();

					if (testFiles.length === 0) {
						vscode.window.showInformationMessage('No test files found in workspace');
						return;
					}

					if (token.isCancellationRequested) {
						return;
					}

					// Step 2: Read file contents (prefer dirty content from editors)
					progress.report({
						message: `Reading ${testFiles.length} file${testFiles.length === 1 ? '' : 's'}...`
					});
					const filesWithContent = await this.readFileContents(testFiles);

					if (token.isCancellationRequested) {
						return;
					}

					// Step 3: Build and send request
					progress.report({ message: 'Analyzing...' });
					const request: QualityAnalysisRequest = {
						files: filesWithContent,
						mode: mode || QualityConfigManager.getAnalysisMode()
					};

					const startTime = Date.now();
					const result = await this.backendClient.analyzeQuality(request);
					const duration = Date.now() - startTime;

					if (token.isCancellationRequested) {
						return;
					}

					// Step 4: Update UI
					this.treeProvider.refresh(result);

					// Step 5: Notify listeners (for diagnostics, decorations)
					if (this.onAnalysisComplete) {
						this.onAnalysisComplete(result);
					}

					// Step 6: Show summary
					this.showResultSummary(result, duration);
				}
			);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Find all pytest test files in the workspace.
	 */
	private async findTestFiles(): Promise<vscode.Uri[]> {
		const testPatterns = ['**/test_*.py', '**/*_test.py'];
		const excludePatterns = [
			'**/node_modules/**',
			'**/.venv/**',
			'**/venv/**',
			'**/__pycache__/**',
			'**/dist/**',
			'**/build/**'
		];

		const files: vscode.Uri[] = [];
		for (const pattern of testPatterns) {
			const found = await vscode.workspace.findFiles(
				pattern,
				`{${excludePatterns.join(',')}}`
			);
			files.push(...found);
		}

		// Remove duplicates
		return Array.from(new Map(files.map(f => [f.fsPath, f])).values());
	}

	/**
	 * Read contents of all test files.
	 * Prefers dirty content from open editors over saved files.
	 */
	private async readFileContents(files: vscode.Uri[]): Promise<FileInput[]> {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		if (!workspaceRoot) {
			throw new Error('No workspace folder found');
		}

		return Promise.all(
			files.map(async (file) => {
				// Check for dirty content in open editor
				const openDoc = vscode.workspace.textDocuments.find(
					doc => doc.uri.fsPath === file.fsPath
				);

				let content: string;
				if (openDoc) {
					// Use editor content (may be unsaved)
					content = openDoc.getText();
				} else {
					// Read from disk
					const bytes = await vscode.workspace.fs.readFile(file);
					content = Buffer.from(bytes).toString('utf8');
				}

				const relativePath = path.relative(workspaceRoot, file.fsPath)
					.replace(/\\/g, '/');

				return { path: relativePath, content };
			})
		);
	}

	/**
	 * Show summary notification after analysis.
	 */
	private showResultSummary(result: QualityAnalysisResponse, duration: number): void {
		const { summary, issues } = result;
		const total = summary.total_issues;
		const critical = summary.critical_issues;

		let message: string;
		if (total === 0) {
			message = `All tests look good! (${duration}ms)`;
			vscode.window.showInformationMessage(message);
		} else if (critical > 0) {
			message = `Found ${total} issue${total === 1 ? '' : 's'} (${critical} critical) in ${duration}ms`;
			vscode.window.showWarningMessage(message);
		} else {
			message = `Found ${total} issue${total === 1 ? '' : 's'} in ${duration}ms`;
			vscode.window.showInformationMessage(message);
		}
	}

	/**
	 * Handle errors during analysis.
	 */
	private handleError(error: unknown): void {
		console.error('[Quality] Analysis error:', error);

		let message = 'Failed to analyze test quality';

		if (this.isBackendError(error)) {
			message = `${error.message}: ${error.detail}`;
		} else if (error instanceof Error) {
			message = error.message;
		}

		vscode.window.showErrorMessage(`Quality Analysis: ${message}`);
	}

	/**
	 * Type guard for BackendError.
	 */
	private isBackendError(error: unknown): error is BackendError {
		return (
			typeof error === 'object' &&
			error !== null &&
			'type' in error &&
			'message' in error
		);
	}
}

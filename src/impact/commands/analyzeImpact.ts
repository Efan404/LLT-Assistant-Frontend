/**
 * Analyze Impact Command
 * Main command handler for impact analysis
 */

import * as vscode from 'vscode';
import { GitDiffExtractor } from '../git/diffExtractor';
import { ImpactAnalysisClient } from '../api/impactClient';
import { ImpactTreeProvider } from '../ui/impactTreeProvider';
import { ChangeDetectionResult } from '../models/types';
import { DetectCodeChangesRequest } from '../api/types';

/**
 * Analyze Impact Command
 */
export class AnalyzeImpactCommand {
	constructor(
		private client: ImpactAnalysisClient,
		private treeProvider: ImpactTreeProvider
	) {}

	/**
	 * Execute the analyze impact command
	 */
	async execute(): Promise<void> {
		try {
			// Get workspace root
			const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
			if (!workspaceRoot) {
				vscode.window.showErrorMessage('No workspace folder open');
				return;
			}

			await vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: 'Analyzing code changes...',
					cancellable: false
				},
				async (progress) => {
					try {
						// Step 1: Check backend health
						progress.report({ message: 'Checking backend connection...', increment: 10 });
						const isHealthy = await this.client.checkHealth();
						if (!isHealthy) {
							vscode.window.showWarningMessage(
								'Backend is not responding. Please check your connection.'
							);
							return;
						}

						// Step 2: Extract git diff
						progress.report({ message: 'Extracting code changes from git...', increment: 20 });
						const diffExtractor = new GitDiffExtractor(workspaceRoot);
						const changes = await diffExtractor.getWorkingDirChanges();

						if (changes.size === 0) {
							vscode.window.showInformationMessage(
								'No changes detected in working directory'
							);
							this.treeProvider.clear();
							return;
						}

						// Step 3: Get all test files
						progress.report({ message: 'Collecting test files...', increment: 30 });
						const previousTests = await diffExtractor.getAllTestFiles();

						// Step 4: Send to backend for analysis
						progress.report({ message: 'Analyzing impact on tests...', increment: 40 });

						// Process each changed file
						const allAffectedTests: any[] = [];
						const allFunctionChanges: any[] = [];
						let totalLinesAdded = 0;
						let totalLinesRemoved = 0;
						const failedFiles: string[] = [];

						for (const [filePath, change] of changes.entries()) {
							const request: DetectCodeChangesRequest = {
								changes: {
									old_code: change.old_content,
									new_code: change.new_content,
									file_path: filePath
								},
								previous_tests: previousTests
							};

							try {
								const response = await this.client.detectCodeChanges(request);

								// Collect results
								allAffectedTests.push(...response.affected_tests);
								allFunctionChanges.push(...response.change_summary.functions_changed);
								totalLinesAdded += response.change_summary.lines_added;
								totalLinesRemoved += response.change_summary.lines_removed;
							} catch (error) {
								console.error(`Error analyzing ${filePath}:`, error);
								failedFiles.push(filePath);
								// Continue with other files
							}
						}

						// Step 5: Build combined result
						progress.report({ message: 'Building analysis results...', increment: 80 });

						const result: ChangeDetectionResult = {
							context_id: `analysis-${Date.now()}`,
							affected_tests: allAffectedTests,
							change_summary: {
								functions_changed: allFunctionChanges,
								lines_added: totalLinesAdded,
								lines_removed: totalLinesRemoved,
								change_type: this.determineChangeType(totalLinesAdded, totalLinesRemoved)
							},
							timestamp: Date.now()
						};

						// Step 6: Update tree view
						progress.report({ message: 'Displaying results...', increment: 100 });
						this.treeProvider.refresh(result);

						// Show summary
						const filesChanged = changes.size;
						const testsAffected = allAffectedTests.length;
						const successCount = filesChanged - failedFiles.length;

						// Build summary message
						let summaryMessage = `Impact analysis complete: ${successCount}/${filesChanged} files analyzed`;

						if (testsAffected > 0) {
							summaryMessage += `, ${testsAffected} tests affected`;
						} else {
							summaryMessage += ', no tests affected';
						}

						// Show message with appropriate severity
						if (failedFiles.length > 0) {
							summaryMessage += `\n\n⚠️ ${failedFiles.length} file(s) failed: ${failedFiles.join(', ')}`;
							vscode.window.showWarningMessage(summaryMessage);
						} else {
							vscode.window.showInformationMessage(summaryMessage);
						}
					} catch (error) {
						console.error('Error during impact analysis:', error);
						vscode.window.showErrorMessage(
							`Impact analysis failed: ${error instanceof Error ? error.message : String(error)}`
						);
					}
				}
			);
		} catch (error) {
			console.error('Error in analyze impact command:', error);
			vscode.window.showErrorMessage(
				`Failed to analyze impact: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Determine change type based on line changes
	 */
	private determineChangeType(linesAdded: number, linesRemoved: number): any {
		const totalChanges = linesAdded + linesRemoved;

		if (totalChanges > 100) {
			return 'feature_addition';
		} else if (linesRemoved > linesAdded * 2) {
			return 'refactor';
		} else if (linesAdded > linesRemoved * 2) {
			return 'feature_addition';
		} else {
			return 'bug_fix';
		}
	}
}

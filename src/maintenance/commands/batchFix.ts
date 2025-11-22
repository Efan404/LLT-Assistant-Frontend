/**
 * Batch Fix Command
 * Handles batch fixing of affected test cases
 */

import * as vscode from 'vscode';
import { MaintenanceBackendClient } from '../api/maintenanceClient';
import { MaintenanceTreeProvider } from '../ui/maintenanceTreeProvider';
import { MaintenanceResult, AffectedTestCase, BatchFixResult, UserDecisionType } from '../models/types';
import { BatchFixRequest } from '../api/types';
import { BackendAgentController } from '../../agents';
import { TestGenerationController } from '../../generation';
import { PythonASTAnalyzer } from '../../analysis';
import { ConfigurationManager } from '../../api';
import * as path from 'path';

/**
 * Batch Fix Command
 */
export class BatchFixCommand {
	constructor(
		private client: MaintenanceBackendClient,
		private treeProvider: MaintenanceTreeProvider
	) {}

	/**
	 * Execute batch fix based on user decision
	 * @param decision User decision (functionality_changed or refactor_only)
	 * @param userDescription Optional description for functionality changes
	 */
	async execute(
		decision: UserDecisionType,
		userDescription?: string,
		selectedTests?: AffectedTestCase[]
	): Promise<void> {
		try {
			const result = this.treeProvider.getAnalysisResult();
			if (!result) {
				vscode.window.showWarningMessage(
					'No maintenance analysis available. Run "Analyze Maintenance" first.'
				);
				return;
			}

			// Use selected tests or all affected tests
			const testsToFix = selectedTests || result.affected_tests;

			if (testsToFix.length === 0) {
				vscode.window.showInformationMessage('No tests selected for fixing');
				return;
			}

			await vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: decision === 'functionality_changed' ? 'Regenerating tests...' : 'Improving test coverage...',
					cancellable: false
				},
				async (progress) => {
					try {
						if (decision === 'functionality_changed') {
							await this.regenerateTests(testsToFix, result, userDescription || '', progress);
						} else if (decision === 'refactor_only') {
							await this.improveCoverage(testsToFix, result, progress);
						}
					} catch (error) {
						console.error('[Maintenance] Error during batch fix:', error);
						vscode.window.showErrorMessage(
							`Batch fix failed: ${error instanceof Error ? error.message : String(error)}`
						);
					}
				}
			);
		} catch (error) {
			console.error('[Maintenance] Error in batch fix command:', error);
			vscode.window.showErrorMessage(
				`Failed to batch fix tests: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Regenerate tests for functionality changes
	 */
	private async regenerateTests(
		tests: AffectedTestCase[],
		result: MaintenanceResult,
		userDescription: string,
		progress: vscode.Progress<{ message?: string; increment?: number }>
	): Promise<void> {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceRoot) {
			throw new Error('No workspace folder open');
		}

		// Initialize components
		const configManager = new ConfigurationManager();
		const backendUrl = configManager.getBackendUrl();
		const backendController = new BackendAgentController(backendUrl);
		const testGenerator = new TestGenerationController();
		const astAnalyzer = new PythonASTAnalyzer();

		let successCount = 0;
		let failCount = 0;

		// Process each test
		for (let i = 0; i < tests.length; i++) {
			const test = tests[i];

			progress.report({
				message: `Regenerating test ${i + 1}/${tests.length}: ${test.test_name}`,
				increment: (100 / tests.length)
			});

			try {
				// Find source file and function
				const sourceFile = test.source_file || this.findSourceFile(test, result);
				const functionName = test.source_function || this.extractFunctionName(test);

				if (!sourceFile) {
					console.error(`Cannot find source file for test ${test.test_name}`);
					failCount++;
					continue;
				}

				const fullSourcePath = path.join(workspaceRoot, sourceFile);

				// Build function context
				const analysisResult = await astAnalyzer.buildFunctionContext(
					fullSourcePath,
					functionName
				);

				if (!analysisResult.success || !analysisResult.data) {
					console.error(`Failed to analyze function for ${test.test_name}`);
					failCount++;
					continue;
				}

				const functionContext = analysisResult.data;

				// Generate test using backend
				const pipelineResult = await backendController.runFullPipeline(
					functionContext,
					userDescription || `Regenerate test for ${functionName}`,
					async () => {
						// Auto-confirm
						return { confirmed: true, cancelled: false };
					}
				);

				if (!pipelineResult.success || !pipelineResult.stage2Response) {
					console.error(`Failed to generate test for ${test.test_name}`);
					failCount++;
					continue;
				}

				// Generate and insert test
				const generationResult = await testGenerator.generateAndInsertTests(
					pipelineResult.stage2Response,
					functionContext,
					fullSourcePath
				);

				if (generationResult.success) {
					successCount++;
				} else {
					failCount++;
				}
			} catch (error) {
				console.error(`Error regenerating test ${test.test_name}:`, error);
				failCount++;
			}
		}

		// Show summary
		if (successCount > 0) {
			vscode.window.showInformationMessage(
				`✅ ${successCount} test(s) regenerated successfully` +
				(failCount > 0 ? `, ${failCount} failed` : '')
			);
		} else {
			vscode.window.showWarningMessage('No tests were regenerated');
		}
	}

	/**
	 * Improve coverage for refactoring
	 */
	private async improveCoverage(
		tests: AffectedTestCase[],
		result: MaintenanceResult,
		progress: vscode.Progress<{ message?: string; increment?: number }>
	): Promise<void> {
		// Prepare batch fix request
		const request: BatchFixRequest = {
			action: 'improve_coverage',
			tests: tests.map(test => ({
				test_file: test.test_file,
				test_name: test.test_name,
				test_class: test.test_class,
				function_name: test.source_function || '',
				source_file: test.source_file || ''
			}))
		};

		progress.report({ message: 'Sending request to backend...', increment: 30 });

		try {
			const response = await this.client.batchFixTests(request);

			progress.report({ message: 'Processing results...', increment: 80 });

			const successCount = response.results.filter(r => r.success).length;
			const failCount = response.results.filter(r => !r.success).length;

			// Show summary
			if (successCount > 0) {
				vscode.window.showInformationMessage(
					`✅ Coverage improved for ${successCount} test(s)` +
					(failCount > 0 ? `, ${failCount} failed` : '')
				);
			} else {
				vscode.window.showWarningMessage('No tests were improved');
			}
		} catch (error) {
			throw new Error(`Backend request failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Find source file for a test
	 */
	private findSourceFile(test: AffectedTestCase, result: MaintenanceResult): string | null {
		// Try to match test file to source file
		const testFileName = test.test_file.split('/').pop() || '';
		const expectedSourceFileName = testFileName.replace(/^test_/, '').replace(/_test\.py$/, '.py');

		// Look in code changes
		for (const change of result.code_changes) {
			const sourceFileName = change.file_path.split('/').pop() || '';
			if (sourceFileName === expectedSourceFileName) {
				return change.file_path;
			}
		}

		// Fallback: use first changed file
		if (result.code_changes.length > 0) {
			return result.code_changes[0].file_path;
		}

		return null;
	}

	/**
	 * Extract function name from test
	 */
	private extractFunctionName(test: AffectedTestCase): string {
		// Infer from test name: test_add -> add
		return test.test_name.replace(/^test_/, '');
	}
}


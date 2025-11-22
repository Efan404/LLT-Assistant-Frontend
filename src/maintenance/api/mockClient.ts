/**
 * Mock Maintenance Backend Client
 * Provides mock data for frontend testing without backend
 */

import {
	AnalyzeMaintenanceRequest,
	AnalyzeMaintenanceResponse,
	BatchFixRequest,
	BatchFixResponse,
	GetCodeDiffRequest,
	GetCodeDiffResponse,
	HealthCheckResponse
} from './types';

/**
 * Mock Maintenance Backend Client
 * Returns mock data for testing UI without backend
 */
export class MockMaintenanceBackendClient {
	/**
	 * Check backend health (always returns true in mock mode)
	 */
	async checkHealth(): Promise<boolean> {
		// Simulate network delay
		await new Promise(resolve => setTimeout(resolve, 500));
		return true;
	}

	/**
	 * Analyze maintenance - returns mock affected tests
	 */
	async analyzeMaintenance(
		request: AnalyzeMaintenanceRequest
	): Promise<AnalyzeMaintenanceResponse> {
		// Simulate network delay
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Generate mock affected tests based on changed functions
		const affectedTests = this.generateMockAffectedTests(request.changes);

		return {
			context_id: `mock-ctx-${Date.now()}`,
			affected_tests: affectedTests,
			change_summary: {
				files_changed: request.changes.length,
				functions_changed: this.extractAllFunctions(request.changes),
				lines_added: request.changes.reduce((sum, c) => sum + c.lines_added, 0),
				lines_removed: request.changes.reduce((sum, c) => sum + c.lines_removed, 0),
				change_type: this.determineChangeType(request.changes)
			}
		};
	}

	/**
	 * Batch fix tests - returns mock results
	 */
	async batchFixTests(request: BatchFixRequest): Promise<BatchFixResponse> {
		// Simulate network delay
		await new Promise(resolve => setTimeout(resolve, 2000));

		const results = request.tests.map(test => ({
			test_file: test.test_file,
			test_name: test.test_name,
			success: true,
			new_code: this.generateMockTestCode(test.test_name, test.function_name)
		}));

		return {
			success: true,
			processed_count: results.length,
			results
		};
	}

	/**
	 * Get code diff details
	 */
	async getCodeDiff(request: GetCodeDiffRequest): Promise<GetCodeDiffResponse> {
		await new Promise(resolve => setTimeout(resolve, 300));

		return {
			unified_diff: this.generateUnifiedDiff(request.old_content, request.new_content),
			changed_functions: this.extractFunctionsFromCode(request.new_content),
			lines_added: request.new_content.split('\n').length - request.old_content.split('\n').length,
			lines_removed: request.old_content.split('\n').length - request.new_content.split('\n').length
		};
	}

	/**
	 * Update backend URL (no-op in mock mode)
	 */
	updateBackendUrl(): void {
		// No-op
	}

	/**
	 * Generate mock affected tests based on code changes
	 */
	private generateMockAffectedTests(changes: any[]): any[] {
		const tests: any[] = [];

		for (const change of changes) {
			const fileName = change.file_path.split('/').pop() || change.file_path;
			const baseName = fileName.replace('.py', '');

			// Generate test file name
			const testFileName = `tests/test_${baseName}.py`;

			// For each changed function, create an affected test
			for (const funcName of change.changed_functions) {
				const testName = `test_${funcName}`;

				// Determine impact level based on lines changed
				let impactLevel: 'critical' | 'high' | 'medium' | 'low' = 'medium';
				const totalChanges = change.lines_added + change.lines_removed;
				if (totalChanges > 20) {
					impactLevel = 'critical';
				} else if (totalChanges > 10) {
					impactLevel = 'high';
				} else if (totalChanges < 5) {
					impactLevel = 'low';
				}

				tests.push({
					test_file: testFileName,
					test_name: testName,
					test_class: `Test${this.capitalize(baseName)}`,
					impact_level: impactLevel,
					reason: `Function "${funcName}" was modified. ${change.lines_added} lines added, ${change.lines_removed} lines removed.`,
					requires_update: totalChanges > 5,
					line_number: Math.floor(Math.random() * 50) + 10, // Random line number
					source_file: change.file_path,
					source_function: funcName
				});
			}

			// If no functions detected, create a generic test
			if (change.changed_functions.length === 0 && change.lines_added > 0) {
				tests.push({
					test_file: testFileName,
					test_name: 'test_general',
					impact_level: 'medium',
					reason: `File "${fileName}" was modified. Code structure may have changed.`,
					requires_update: true,
					line_number: 15,
					source_file: change.file_path,
					source_function: 'unknown'
				});
			}
		}

		return tests;
	}

	/**
	 * Extract all function names from changes
	 */
	private extractAllFunctions(changes: any[]): string[] {
		const functions: string[] = [];
		for (const change of changes) {
			functions.push(...change.changed_functions);
		}
		return [...new Set(functions)]; // Remove duplicates
	}

	/**
	 * Determine change type
	 */
	private determineChangeType(changes: any[]): 'refactor' | 'feature_addition' | 'bug_fix' | 'breaking_change' {
		let totalAdded = 0;
		let totalRemoved = 0;

		for (const change of changes) {
			totalAdded += change.lines_added;
			totalRemoved += change.lines_removed;
		}

		if (totalAdded > totalRemoved * 2) {
			return 'feature_addition';
		} else if (totalRemoved > totalAdded * 2) {
			return 'refactor';
		} else if (totalRemoved > 0 && totalAdded === 0) {
			return 'breaking_change';
		} else {
			return 'bug_fix';
		}
	}

	/**
	 * Generate mock test code
	 */
	private generateMockTestCode(testName: string, functionName: string): string {
		return `def ${testName}():\n    """Test for ${functionName} function"""\n    # Mock generated test code\n    assert True\n`;
	}

	/**
	 * Generate unified diff
	 */
	private generateUnifiedDiff(oldContent: string, newContent: string): string {
		const oldLines = oldContent.split('\n');
		const newLines = newContent.split('\n');

		let diff = '--- a/file.py\n+++ b/file.py\n@@ -1,1 +1,1 @@\n';
		for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
			if (i < oldLines.length && i < newLines.length) {
				if (oldLines[i] !== newLines[i]) {
					diff += `-${oldLines[i]}\n+${newLines[i]}\n`;
				} else {
					diff += ` ${oldLines[i]}\n`;
				}
			} else if (i < oldLines.length) {
				diff += `-${oldLines[i]}\n`;
			} else {
				diff += `+${newLines[i]}\n`;
			}
		}
		return diff;
	}

	/**
	 * Extract function names from code
	 */
	private extractFunctionsFromCode(code: string): string[] {
		const functions: string[] = [];
		const functionRegex = /^\s*def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gm;
		let match;
		while ((match = functionRegex.exec(code)) !== null) {
			functions.push(match[1]);
		}
		return functions;
	}

	/**
	 * Capitalize first letter
	 */
	private capitalize(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
}


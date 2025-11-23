/**
 * Test Data Factories
 *
 * Factory functions for creating test data objects
 */

import { MockTextDocument, Uri } from '../mocks/vscode';
import type {
  QualityAnalysisResponse,
  QualityIssue,
  FixSuggestion,
  AnalysisSummary,
} from '../../quality/api/types';

/**
 * Create a mock quality issue
 */
export function createMockQualityIssue(
  overrides: Partial<QualityIssue> = {}
): QualityIssue {
  return {
    file_path: 'tests/test_example.py',
    line: 10,
    column: 4,
    severity: 'error',
    code: 'trivial-assertion',
    message: 'This assertion is trivial and always passes',
    detected_by: 'rule',
    suggestion: {
      type: 'delete',
      new_text: '',
      description: 'Remove this trivial assertion',
    },
    ...overrides,
  };
}

/**
 * Create a mock quality suggestion
 */
export function createMockSuggestion(
  overrides: Partial<FixSuggestion> = {}
): FixSuggestion {
  return {
    type: 'replace',
    new_text: 'assert x == expected_value',
    description: 'Make assertion more meaningful',
    ...overrides,
  };
}

/**
 * Create mock quality summary
 */
export function createMockQualitySummary(
  overrides: Partial<AnalysisSummary> = {}
): AnalysisSummary {
  return {
    total_files: 5,
    total_issues: 12,
    critical_issues: 3,
    ...overrides,
  };
}

/**
 * Create a mock quality analysis response
 */
export function createMockAnalysisResponse(
  overrides: Partial<QualityAnalysisResponse> = {}
): QualityAnalysisResponse {
  return {
    analysis_id: '550e8400-e29b-41d4-a716-446655440000',
    issues: [
      createMockQualityIssue(),
      createMockQualityIssue({
        line: 15,
        severity: 'warning',
        code: 'missing-assertion',
        message: 'Test lacks proper assertions',
      }),
    ],
    summary: createMockQualitySummary(),
    ...overrides,
  };
}

/**
 * Create a mock Python test file content
 */
export function createMockPytestFile(testCount: number = 3): string {
  const tests = [];
  for (let i = 1; i <= testCount; i++) {
    tests.push(`def test_example_${i}():
    assert True`);
  }
  return tests.join('\n\n');
}

/**
 * Create a mock text document
 */
export function createMockTextDocument(
  content: string = createMockPytestFile(),
  fileName: string = 'test_example.py'
): MockTextDocument {
  const uri = createMockUri(`/workspace/${fileName}`);
  return new MockTextDocument(uri, content);
}

/**
 * Create mock analysis issues for different scenarios
 */
export const mockIssues = {
  trivialAssertion: createMockQualityIssue({
    code: 'trivial-assertion',
    message: 'Assertion always passes',
    severity: 'error',
  }),

  missingAssertion: createMockQualityIssue({
    code: 'missing-assertion',
    message: 'Test has no assertions',
    severity: 'warning',
    line: 15,
  }),

  duplicateAssertion: createMockQualityIssue({
    code: 'duplicate-assertion',
    message: 'Duplicate assertion detected',
    severity: 'info',
    line: 20,
  }),

  namingUnclear: createMockQualityIssue({
    code: 'naming-unclear',
    message: 'Test name is unclear',
    severity: 'info',
    line: 5,
  }),
};

/**
 * Create a list of mock issues
 */
export function createMockIssueList(count: number = 5, filePath?: string): QualityIssue[] {
  const issueTypes = Object.values(mockIssues);
  return Array.from({ length: count }, (_, i) => ({
    ...issueTypes[i % issueTypes.length],
    file_path: filePath || issueTypes[i % issueTypes.length].file_path,
    line: (i + 1) * 10,
  }));
}

/**
 * Create mock analysis response with specific issue types
 */
export function createMockAnalysisWithIssues(
  issueCount: number = 3,
  criticalCount: number = 1
): QualityAnalysisResponse {
  const issues = createMockIssueList(issueCount);

  // Mark some as critical (error severity)
  for (let i = 0; i < Math.min(criticalCount, issues.length); i++) {
    issues[i].severity = 'error';
  }

  return {
    analysis_id: '550e8400-e29b-41d4-a716-446655440000',
    issues,
    summary: {
      total_files: 1,
      total_issues: issueCount,
      critical_issues: criticalCount,
    },
  };
}

/**
 * Create a mock VSCode URI
 */
export function createMockUri(path: string = '/workspace/test_example.py'): Uri {
  return Uri.file(path);
}

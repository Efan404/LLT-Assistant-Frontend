import * as fs from "fs";
import * as path from "path";

export interface CoverageReport {
  timestamp: string;
  currentCoverage: number;
  targetCoverage: number;
  gaps: Array<{
    file: string;
    lineNumber: number;
    type: string;
    priority: string;
  }>;
  estimatedImprovement: number;
  estimatedNewCoverage: number;
  recommendations: string[];
  generatedTests: number;
}

/**
 * Generate coverage improvement reports (text, JSON, HTML format)
 */
export class ImprovementReporter {
  /**
   * Generate console report
   */
  static generateConsoleReport(report: CoverageReport): string {
    const lines: string[] = [];

    lines.push(
      "╔════════════════════════════════════════════════════════════════╗"
    );
    lines.push(
      "║       Coverage Improvement Report                             ║"
    );
    lines.push(
      "╚════════════════════════════════════════════════════════════════╝"
    );
    lines.push("");

    // Summary
    lines.push("📊 Coverage Summary");
    lines.push("─".repeat(65));
    lines.push(
      `Current Coverage:  ${report.currentCoverage.toFixed(2)}%`.padEnd(40) +
        `Target Coverage: ${report.targetCoverage}%`
    );
    lines.push(
      `Estimated Improvement:    ${report.estimatedImprovement.toFixed(2)}%`.padEnd(40) +
        `Coverage After Optimization: ${report.estimatedNewCoverage.toFixed(2)}%`
    );
    lines.push("");

    // Gap Analysis
    lines.push("🔍 Coverage Gap Analysis");
    lines.push("─".repeat(65));

    const gapsByType = this.groupGapsByType(report.gaps);
    gapsByType.forEach(([type, gaps]) => {
      const icon =
        gaps[0].priority === "HIGH"
          ? "🔴"
          : gaps[0].priority === "MEDIUM"
            ? "🟡"
            : "🟢";
      lines.push(`${icon} ${type}: ${gaps.length} gaps`);
      gaps.slice(0, 3).forEach((gap) => {
        lines.push(`   └─ ${gap.file}:${gap.lineNumber}`);
      });
      if (gaps.length > 3) {
        lines.push(`   └─ ${gaps.length - 3} more gaps...`);
      }
    });
    lines.push("");

    // Recommendations
    lines.push("💡 Optimization Recommendations");
    lines.push("─".repeat(65));
    report.recommendations.forEach((rec, idx) => {
      lines.push(`${idx + 1}. ${rec}`);
    });
    lines.push("");

    // Generated test cases
    lines.push("✅ Auto-generated Test Cases");
    lines.push("─".repeat(65));
    lines.push(`Generated ${report.generatedTests} new supplementary test cases`);
    lines.push("Run command: npm run test -- --coverage");
    lines.push("");

    // Progress bar
    const barLength = 50;
    const filledLength = Math.round(
      (report.estimatedNewCoverage / 100) * barLength
    );
    const emptyLength = barLength - filledLength;
    const bar = "█".repeat(filledLength) + "░".repeat(emptyLength);
    lines.push(
      `📈 Coverage Progress: [${bar}] ${report.estimatedNewCoverage.toFixed(1)}%`
    );
    lines.push("");

    lines.push("Generated: " + report.timestamp);
    lines.push(
      "═".repeat(65)
    );

    return lines.join("\n");
  }

  /**
   * Generate JSON report
   */
  static generateJsonReport(report: CoverageReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate HTML report
   */
  static generateHtmlReport(report: CoverageReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coverage Improvement Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .content { padding: 40px; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .metric {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      text-align: center;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #667eea;
      margin: 10px 0;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .progress-section {
      margin-bottom: 40px;
    }
    .progress-bar {
      width: 100%;
      height: 40px;
      background: #e9ecef;
      border-radius: 20px;
      overflow: hidden;
      margin: 20px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      transition: width 0.3s ease;
    }
    .gaps-section {
      margin-bottom: 40px;
    }
    .gap-item {
      padding: 15px;
      margin-bottom: 10px;
      border-left: 4px solid #dc3545;
      background: #fff5f5;
      border-radius: 4px;
    }
    .gap-item.medium { border-left-color: #ffc107; background: #fffbf0; }
    .gap-item.low { border-left-color: #28a745; background: #f0fff4; }
    .recommendations {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 40px;
    }
    .recommendations h3 {
      margin-bottom: 15px;
      color: #333;
    }
    .recommendations ol {
      padding-left: 20px;
    }
    .recommendations li {
      margin-bottom: 10px;
      color: #555;
      line-height: 1.6;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #999;
      font-size: 12px;
      border-top: 1px solid #e9ecef;
    }
    h2 { color: #333; margin-bottom: 20px; font-size: 20px; }
    h3 { color: #555; margin-bottom: 15px; font-size: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Coverage Improvement Report</h1>
      <p>Code Coverage Analysis & Optimization</p>
    </div>

    <div class="content">
      <!-- Metric Cards -->
      <div class="metrics">
        <div class="metric">
          <div class="metric-label">Current Coverage</div>
          <div class="metric-value">${report.currentCoverage.toFixed(1)}%</div>
        </div>
        <div class="metric">
          <div class="metric-label">Estimated Improvement</div>
          <div class="metric-value">+${report.estimatedImprovement.toFixed(1)}%</div>
        </div>
        <div class="metric">
          <div class="metric-label">Coverage After Optimization</div>
          <div class="metric-value">${report.estimatedNewCoverage.toFixed(1)}%</div>
        </div>
        <div class="metric">
          <div class="metric-label">Generated Test Cases</div>
          <div class="metric-value">${report.generatedTests}</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-section">
        <h2>🎯 Coverage Progress</h2>
        <p>Target: ${report.targetCoverage}%</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${report.estimatedNewCoverage}%">
            ${report.estimatedNewCoverage.toFixed(1)}%
          </div>
        </div>
      </div>

      <!-- Coverage Gaps -->
      <div class="gaps-section">
        <h2>🔍 Coverage Gap Analysis</h2>
        ${report.gaps
          .slice(0, 10)
          .map(
            (gap) => `
          <div class="gap-item ${gap.priority.toLowerCase()}">
            <strong>${gap.file}:${gap.lineNumber}</strong>
            <br>
            <small>${gap.type} (${gap.priority} priority)</small>
          </div>
        `
          )
          .join("")}
        ${report.gaps.length > 10 ? `<p>${report.gaps.length - 10} more gaps...</p>` : ""}
      </div>

      <!-- Recommendations -->
      <div class="recommendations">
        <h3>💡 Optimization Recommendations</h3>
        <ol>
          ${report.recommendations.map((rec) => `<li>${rec}</li>`).join("")}
        </ol>
      </div>
    </div>

    <div class="footer">
      <p>Generated: ${report.timestamp}</p>
      <p>This report was automatically generated by the Coverage Optimization System</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Save report to file
   */
  static saveReport(
    report: CoverageReport,
    outputDir: string,
    format: "json" | "html" | "txt" = "json"
  ): string {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    let filename: string;
    let content: string;

    switch (format) {
      case "json":
        filename = `coverage-report-${timestamp}.json`;
        content = this.generateJsonReport(report);
        break;
      case "html":
        filename = `coverage-report-${timestamp}.html`;
        content = this.generateHtmlReport(report);
        break;
      case "txt":
      default:
        filename = `coverage-report-${timestamp}.txt`;
        content = this.generateConsoleReport(report);
        break;
    }

    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, content, "utf8");

    return filePath;
  }

  /**
   * Group gaps by type
   */
  private static groupGapsByType(
    gaps: Array<{
      file: string;
      lineNumber: number;
      type: string;
      priority: string;
    }>
  ): Array<
    [
      string,
      Array<{
        file: string;
        lineNumber: number;
        type: string;
        priority: string;
      }>,
    ]
  > {
    const grouped = new Map();

    gaps.forEach((gap) => {
      if (!grouped.has(gap.type)) {
        grouped.set(gap.type, []);
      }
      grouped.get(gap.type).push(gap);
    });

    return Array.from(grouped.entries());
  }
}
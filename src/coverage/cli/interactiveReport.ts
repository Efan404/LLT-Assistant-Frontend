import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { ImprovementReporter, CoverageReport } from "../report/improvementReporter";

/**
 * Interactive CLI report generation
 */
export class InteractiveReport {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async run() {
    console.clear();
    console.log("╔════════════════════════════════════════════════════════════════╗");
    console.log("║    Coverage Optimization - Interactive Report Generator         ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    // Collect information
    const currentCoverage = await this.askNumber(
      "Enter current coverage (%): ",
      75
    );
    const targetCoverage = await this.askNumber("Enter target coverage (%): ", 90);
    const gapCount = await this.askNumber(
      "Enter number of identified coverage gaps: ",
      25
    );

    // Generate sample report
    const report: CoverageReport = {
      timestamp: new Date().toISOString(),
      currentCoverage,
      targetCoverage,
      gaps: this.generateSampleGaps(gapCount),
      estimatedImprovement: Math.min(
        gapCount * 0.5,
        targetCoverage - currentCoverage
      ),
      estimatedNewCoverage: Math.min(
        currentCoverage + gapCount * 0.5,
        100
      ),
      recommendations: [
        "Prioritize branch coverage (Branch Coverage)",
        "Add exception handling tests",
        "Test boundary conditions and special values",
        "Implement end-to-end (E2E) tests",
      ],
      generatedTests: Math.floor(gapCount * 1.5),
    };

    // Display report
    console.log("\n" + ImprovementReporter.generateConsoleReport(report));

    // Show interactive menu
    await this.showMenu(report);

    this.rl.close();
  }

  private async askNumber(question: string, defaultValue: number): Promise<number> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        const num = parseInt(answer) || defaultValue;
        resolve(num);
      });
    });
  }

  private async showMenu(report: CoverageReport) {
    console.log("\n📋 Menu Options:");
    console.log("1. Export JSON report");
    console.log("2. Export HTML report");
    console.log("3. Export text report");
    console.log("4. Exit\n");

    return new Promise<void>((resolve) => {
      this.rl.question("Select option (1-4): ", (choice) => {
        const outputDir = path.join(process.cwd(), "coverage-reports");

        switch (choice) {
          case "1":
            const jsonPath = ImprovementReporter.saveReport(
              report,
              outputDir,
              "json"
            );
            console.log(`✅ JSON report saved: ${jsonPath}`);
            break;
          case "2":
            const htmlPath = ImprovementReporter.saveReport(
              report,
              outputDir,
              "html"
            );
            console.log(`✅ HTML report saved: ${htmlPath}`);
            break;
          case "3":
            const txtPath = ImprovementReporter.saveReport(
              report,
              outputDir,
              "txt"
            );
            console.log(`✅ Text report saved: ${txtPath}`);
            break;
          case "4":
            console.log("👋 Goodbye!");
            break;
          default:
            console.log("❌ Invalid selection");
        }

        resolve();
      });
    });
  }

  private generateSampleGaps(count: number) {
    const gaps = [];
    const types = [
      "uncovered_branch",
      "uncovered_exception",
      "uncovered_statement",
    ];
    const priorities = ["HIGH", "MEDIUM", "LOW"];

    for (let i = 0; i < count; i++) {
      gaps.push({
        file: `src/module${Math.floor(i / 5) + 1}.ts`,
        lineNumber: 10 + i * 5,
        type: types[i % types.length],
        priority: priorities[i % priorities.length],
      });
    }

    return gaps;
  }
}

// CLI entry point
if (require.main === module) {
  const report = new InteractiveReport();
  report.run().catch(console.error);
}
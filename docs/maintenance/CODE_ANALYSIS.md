# 动态维护模块代码解析

## 📋 目录

- [模块架构](#模块架构)
- [核心功能流程](#核心功能流程)
- [关键代码实现](#关键代码实现)
- [数据流分析](#数据流分析)
- [组件交互图](#组件交互图)
- [后端接口对接](#后端接口对接)
- [UI组件详解](#ui组件详解)
- [配置与扩展](#配置与扩展)

---

## 🏗️ 模块架构

### 目录结构

```
src/maintenance/
├── index.ts                    # 模块统一导出入口
├── api/                        # 后端API客户端层
│   ├── index.ts
│   ├── maintenanceClient.ts    # API客户端实现
│   └── types.ts                 # API请求/响应类型
├── git/                        # Git操作层
│   ├── index.ts
│   ├── commitWatcher.ts        # Git提交监控器
│   └── diffAnalyzer.ts         # 代码差异分析器
├── ui/                         # 用户界面层
│   ├── index.ts
│   ├── maintenanceTreeProvider.ts  # 树形视图数据提供者
│   ├── diffViewer.ts           # 差异查看器
│   └── decisionDialog.ts       # 用户决策对话框
├── commands/                   # 命令处理层
│   ├── index.ts
│   ├── analyzeMaintenance.ts   # 分析命令处理器
│   └── batchFix.ts             # 批量修复命令处理器
└── models/                     # 数据模型层
    ├── index.ts
    └── types.ts                # 类型定义
```

### 架构分层

```
┌─────────────────────────────────────┐
│      VSCode Extension API           │
│  (Commands, TreeView, Dialogs)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         UI Layer (ui/)              │
│  - TreeProvider: 显示分析结果        │
│  - DiffViewer: 展示代码差异          │
│  - DecisionDialog: 用户决策交互      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Command Layer (commands/)       │
│  - AnalyzeMaintenance: 分析流程     │
│  - BatchFix: 批量修复流程            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Git Layer (git/)               │
│  - CommitWatcher: 监控提交           │
│  - DiffAnalyzer: 分析差异            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      API Layer (api/)               │
│  - MaintenanceClient: 后端通信       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Backend API                     │
│  https://cs5351.efan.dev/api/v1     │
└──────────────────────────────────────┘
```

---

## 🔄 核心功能流程

### 完整执行流程

```
用户触发分析
    ↓
[1] AnalyzeMaintenanceCommand.execute()
    ├─ 检查后端健康状态
    ├─ 获取Git提交信息 (HEAD vs HEAD~1)
    ├─ 分析代码差异 (DiffAnalyzer)
    ├─ 调用后端API识别受影响测试
    ├─ 更新树形视图 (TreeProvider)
    ├─ 展示代码差异 (DiffViewer)
    └─ 询问用户决策 (DecisionDialog)
    ↓
用户做出决策
    ├─ [是] 功能变更 → 输入描述 → 选择测试
    └─ [否] 仅重构 → 选择测试
    ↓
[2] BatchFixCommand.execute()
    ├─ [功能变更] 重新生成测试
    │   ├─ 分析源函数 (AST Analyzer)
    │   ├─ 调用测试生成API
    │   └─ 插入新测试代码
    └─ [仅重构] 提升覆盖率
        └─ 调用批量修复API
```

---

## 💻 关键代码实现

### 1. 扩展注册 (`src/extension.ts`)

```379:451:src/extension.ts
	// ===== Maintenance Feature =====
	// Initialize maintenance components
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (workspaceRoot) {
		const maintenanceClient = new MaintenanceBackendClient();
		const maintenanceTreeProvider = new MaintenanceTreeProvider();
		const diffAnalyzer = new GitDiffAnalyzer(workspaceRoot);
		const decisionDialog = new DecisionDialogManager();
		const analyzeMaintenanceCommand = new AnalyzeMaintenanceCommand(
			maintenanceClient,
			maintenanceTreeProvider,
			diffAnalyzer,
			decisionDialog
		);
		const batchFixCommand = new BatchFixCommand(maintenanceClient, maintenanceTreeProvider);

		// Register tree view for maintenance
		const maintenanceTreeView = vscode.window.createTreeView('lltMaintenanceExplorer', {
			treeDataProvider: maintenanceTreeProvider,
			showCollapseAll: true
		});
		context.subscriptions.push(maintenanceTreeView);

		// Register maintenance commands
		const analyzeMaintenanceCmd = vscode.commands.registerCommand(
			'llt-assistant.analyzeMaintenance',
			() => analyzeMaintenanceCommand.execute()
		);

		const refreshMaintenanceViewCmd = vscode.commands.registerCommand(
			'llt-assistant.refreshMaintenanceView',
			() => analyzeMaintenanceCommand.execute()
		);

		const clearMaintenanceCmd = vscode.commands.registerCommand(
			'llt-assistant.clearMaintenance',
			() => {
				maintenanceTreeProvider.clear();
				vscode.window.showInformationMessage('Maintenance analysis cleared');
			}
		);

		const batchFixTestsCmd = vscode.commands.registerCommand(
			'llt-assistant.batchFixTests',
			async () => {
				const result = maintenanceTreeProvider.getAnalysisResult();
				if (!result) {
					vscode.window.showWarningMessage(
						'No maintenance analysis available. Run "Analyze Maintenance" first.'
					);
					return;
				}

				// Show decision dialog again if needed
				const decision = await decisionDialog.showDecisionDialog(result);
				if (decision.decision === 'cancelled') {
					return;
				}

				await batchFixCommand.execute(
					decision.decision,
					decision.user_description,
					decision.selected_tests
				);
			}
		);

		context.subscriptions.push(
			analyzeMaintenanceCmd,
			refreshMaintenanceViewCmd,
			clearMaintenanceCmd,
			batchFixTestsCmd
		);
```

**关键点**：
- 组件初始化：创建所有必要的服务实例
- 树形视图注册：`lltMaintenanceExplorer` 视图
- 命令注册：4个主要命令
- 生命周期管理：使用 `context.subscriptions` 管理资源

---

### 2. Git提交监控 (`git/commitWatcher.ts`)

**核心功能**：监控Git仓库的新提交

```33:59:src/maintenance/git/commitWatcher.ts
	startWatching(
		onCommitDetected: (comparison: CommitComparison) => void,
		usePolling: boolean = true,
		pollInterval: number = 5000
	): void {
		if (this.isWatching) {
			console.warn('[Maintenance] Already watching for commits');
			return;
		}

		this.onCommitDetected = onCommitDetected;
		this.isWatching = true;

		// Initialize current commit hash
		try {
			this.currentCommitHash = this.getCurrentCommitHash();
		} catch (error) {
			console.error('[Maintenance] Failed to get initial commit hash:', error);
			this.currentCommitHash = null;
		}

		if (usePolling) {
			this.startPolling(pollInterval);
		} else {
			this.startFileWatching();
		}
	}
```

**监控机制**：
- **轮询模式**（默认）：每5秒检查一次 `git rev-parse HEAD`
- **文件监听模式**：监听 `.git/HEAD` 和 `.git/refs/heads/**` 文件变化

**关键方法**：
- `getCurrentCommitHash()`: 获取当前提交哈希
- `getPreviousCommitHash()`: 获取上一个提交哈希（HEAD~1）
- `compareCommits()`: 比较两个提交，返回变更信息

---

### 3. 差异分析 (`git/diffAnalyzer.ts`)

**核心功能**：分析两次提交之间的代码差异

**关键方法**：

```typescript
// 分析提交差异
async analyzeCommitDiff(
  previousCommitHash: string | null,
  currentCommitHash: string
): Promise<Map<string, CodeChange>>

// 获取代码差异（包含unified diff）
async getCodeDiff(
  filePath: string,
  previousCommitHash: string | null,
  currentCommitHash: string
): Promise<CodeDiff | null>

// 生成变更摘要
generateChangeSummary(changes: Map<string, CodeChange>): ChangeSummary
```

**分析内容**：
1. 提取变更的文件列表（只包含 `.py` 文件，排除测试文件）
2. 获取每个文件的旧内容和新内容
3. 识别变更的函数（通过正则表达式提取函数名）
4. 计算增删行数
5. 生成统一diff格式
6. 判断变更类型（重构/功能添加/修复/破坏性变更）

---

### 4. 分析命令 (`commands/analyzeMaintenance.ts`)

**完整执行流程**：

```30:182:src/maintenance/commands/analyzeMaintenance.ts
	async execute(): Promise<void> {
		try {
			// Get workspace root
			const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
			if (!workspaceRoot) {
				vscode.window.showErrorMessage('No workspace folder open');
				return;
			}

			await vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: 'Analyzing maintenance...',
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

						// Step 2: Get current and previous commit hashes
						progress.report({ message: 'Getting commit information...', increment: 20 });
						const commitWatcher = new GitCommitWatcher(workspaceRoot);
						const currentCommitHash = commitWatcher.getCurrentCommitHash();
						const previousCommitHash = commitWatcher.getPreviousCommitHash();

						if (!currentCommitHash) {
							vscode.window.showWarningMessage('Not a git repository or no commits found');
							return;
						}

						if (!previousCommitHash) {
							vscode.window.showInformationMessage(
								'This appears to be the first commit. No previous commit to compare.'
							);
							return;
						}

						// Step 3: Analyze commit diff
						progress.report({ message: 'Analyzing code changes...', increment: 30 });
						const codeChanges = await this.diffAnalyzer.analyzeCommitDiff(
							previousCommitHash,
							currentCommitHash
						);

						if (codeChanges.size === 0) {
							vscode.window.showInformationMessage('No code changes detected');
							this.treeProvider.clear();
							return;
						}

						// Step 4: Convert to request format
						progress.report({ message: 'Preparing analysis request...', increment: 40 });
						const changes: CodeChange[] = Array.from(codeChanges.values());

						const request: AnalyzeMaintenanceRequest = {
							commit_hash: currentCommitHash,
							previous_commit_hash: previousCommitHash,
							changes
						};

						// Step 5: Send to backend for analysis
						progress.report({ message: 'Identifying affected tests...', increment: 50 });
						const response = await this.client.analyzeMaintenance(request);

						// Step 6: Build result
						progress.report({ message: 'Building analysis results...', increment: 80 });
						const changeSummary = this.diffAnalyzer.generateChangeSummary(codeChanges);

						const result: MaintenanceResult = {
							context_id: response.context_id,
							commit_hash: currentCommitHash,
							previous_commit_hash: previousCommitHash,
							affected_tests: response.affected_tests,
							change_summary: {
								...changeSummary,
								functions_changed: response.change_summary.functions_changed || changeSummary.functions_changed
							},
							code_changes: changes,
							timestamp: Date.now()
						};

						// Step 7: Update tree view
						progress.report({ message: 'Displaying results...', increment: 100 });
						this.treeProvider.refresh(result);

						// Step 8: Show summary and ask for user decision
						const testsAffected = result.affected_tests.length;
						const summaryMessage = `Maintenance analysis complete: ${testsAffected} test(s) affected`;

						if (testsAffected > 0) {
							// Show diff for first changed file
							if (changes.length > 0) {
								const firstChange = changes[0];
								const diff = await this.diffAnalyzer.getCodeDiff(
									firstChange.file_path,
									previousCommitHash,
									currentCommitHash
								);

								if (diff) {
									// Show diff in a non-blocking way
									setTimeout(() => {
										DiffViewer.showDiff(diff, `Changes in ${firstChange.file_path}`);
									}, 500);
								}
							}

							// Ask user for decision
							const decision = await this.decisionDialog.showDecisionDialog(result);

							if (decision.decision === 'cancelled') {
								vscode.window.showInformationMessage('Maintenance analysis cancelled');
								return;
							}

							// Store decision in context for batch fix command
							// The decision is stored in the tree provider's metadata
							// User can use "Batch Fix Tests" command to apply fixes
							if (decision.decision === 'functionality_changed') {
								vscode.window.showInformationMessage(
									`Decision recorded. Use "Batch Fix Tests" command to regenerate ${decision.selected_tests?.length || testsAffected} test(s).`
								);
							} else {
								vscode.window.showInformationMessage(
									`Decision recorded. Use "Batch Fix Tests" command to improve coverage for ${decision.selected_tests?.length || testsAffected} test(s).`
								);
							}
						} else {
							vscode.window.showInformationMessage(summaryMessage);
						}
					} catch (error) {
						console.error('[Maintenance] Error during analysis:', error);
						vscode.window.showErrorMessage(
							`Maintenance analysis failed: ${error instanceof Error ? error.message : String(error)}`
						);
					}
				}
			);
		} catch (error) {
			console.error('[Maintenance] Error in analyze maintenance command:', error);
			vscode.window.showErrorMessage(
				`Failed to analyze maintenance: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
```

**8个执行步骤**：
1. **健康检查** (10%) - 验证后端连接
2. **获取提交信息** (20%) - 获取当前和上一个提交哈希
3. **分析代码差异** (30%) - 提取代码变更
4. **准备请求** (40%) - 构建API请求
5. **调用后端** (50%) - 识别受影响的测试
6. **构建结果** (80%) - 组装分析结果
7. **更新UI** (100%) - 刷新树形视图
8. **用户交互** - 展示差异并询问决策

---

### 5. 批量修复命令 (`commands/batchFix.ts`)

**两种修复模式**：

#### 模式1：功能变更 → 重新生成测试

```typescript
private async regenerateTests(
  tests: AffectedTestCase[],
  result: MaintenanceResult,
  userDescription: string,
  progress: vscode.Progress<{ message?: string; increment?: number }>
): Promise<void>
```

**流程**：
1. 对每个测试用例：
   - 找到对应的源文件和函数
   - 使用AST分析器分析函数
   - 调用测试生成API（使用现有的BackendAgentController）
   - 生成并插入新测试代码

#### 模式2：仅重构 → 提升覆盖率

```typescript
private async improveCoverage(
  tests: AffectedTestCase[],
  result: MaintenanceResult,
  progress: vscode.Progress<{ message?: string; increment?: number }>
): Promise<void>
```

**流程**：
1. 构建批量修复请求
2. 调用后端API `/maintenance/batch-fix`
3. 处理返回结果
4. 显示成功/失败统计

---

### 6. 决策对话框 (`ui/decisionDialog.ts`)

**核心交互流程**：

```18:91:src/maintenance/ui/decisionDialog.ts
	async showDecisionDialog(result: MaintenanceResult): Promise<UserDecision> {
		// Build summary message
		const filesChanged = result.change_summary.files_changed;
		const testsAffected = result.affected_tests.length;
		const functionsChanged = result.change_summary.functions_changed.length;

		const functionsList = result.change_summary.functions_changed
			.slice(0, 5)
			.map((f: string) => `  • ${f}`)
			.join('\n');
		const moreFunctions =
			functionsChanged > 5 ? `\n  ... and ${functionsChanged - 5} more functions` : '';

		const testsList = result.affected_tests
			.slice(0, 5)
			.map((t: AffectedTestCase) => `  • ${t.test_name} [${t.impact_level.toUpperCase()}]`)
			.join('\n');
		const moreTests = testsAffected > 5 ? `\n  ... and ${testsAffected - 5} more tests` : '';

		const message = `**Code Changes Detected**\n\n` +
			`**Commit:** ${result.commit_hash.substring(0, 7)}\n` +
			`**Files changed:** ${filesChanged}\n` +
			`**Functions changed:** ${functionsChanged}\n` +
			`**Tests affected:** ${testsAffected}\n\n` +
			`**Changed functions:**\n${functionsList}${moreFunctions}\n\n` +
			`**Affected tests:**\n${testsList}${moreTests}\n\n` +
			`---\n\n` +
			`**Has the functionality of these functions changed, or is it just refactoring?**\n\n` +
			`• **Yes, functionality changed** → Will regenerate tests with new functionality\n` +
			`• **No, just refactoring** → Will improve test coverage for existing functionality\n` +
			`• **Cancel** → Skip maintenance for now`;

		// Show modal dialog
		const action = await vscode.window.showInformationMessage(
			message,
			{ modal: true },
			'Yes, functionality changed',
			'No, just refactoring',
			'Cancel'
		);

		if (action === 'Yes, functionality changed') {
			// Ask for user description
			const description = await this.promptForFunctionalityDescription(result);
			if (!description) {
				return { decision: 'cancelled' };
			}

			// Ask which tests to regenerate
			const selectedTests = await this.selectTestsToFix(result.affected_tests, 'regenerate');
			if (!selectedTests || selectedTests.length === 0) {
				return { decision: 'cancelled' };
			}

			return {
				decision: 'functionality_changed',
				user_description: description,
				selected_tests: selectedTests
			};
		} else if (action === 'No, just refactoring') {
			// Ask which tests to improve
			const selectedTests = await this.selectTestsToFix(result.affected_tests, 'improve_coverage');
			if (!selectedTests || selectedTests.length === 0) {
				return { decision: 'cancelled' };
			}

			return {
				decision: 'refactor_only',
				selected_tests: selectedTests
			};
		} else {
			return { decision: 'cancelled' };
		}
	}
```

**交互步骤**：
1. 展示变更摘要（文件数、函数数、测试数）
2. 询问："功能是否发生变更？"
3. **如果选择"是"**：
   - 提示输入新功能描述
   - 多选要重新生成的测试用例
4. **如果选择"否"**：
   - 多选要提升覆盖率的测试用例
5. 返回用户决策结果

---

### 7. 树形视图提供者 (`ui/maintenanceTreeProvider.ts`)

**显示结构**：

```
📊 Summary (展开)
  ├─ 📝 X files changed
  ├─ 🧪 Y tests affected
  ├─ 📏 +A / -B lines
  └─ 🔄 Change type: feature_addition
📄 test_calculator.py (2 tests affected)
  ├─ 🔴 test_add [CRITICAL]
  └─ 🟡 test_subtract [MEDIUM]
📄 test_utils.py (1 test affected)
  └─ 🟠 test_format [HIGH]
```

**关键方法**：
- `refresh(data)`: 更新树形视图数据
- `getAnalysisResult()`: 获取当前分析结果
- `getChildren()`: 获取子节点（实现树形结构）

---

## 📊 数据流分析

### 请求数据流

```
用户触发分析
    ↓
GitCommitWatcher.getCurrentCommitHash()
GitCommitWatcher.getPreviousCommitHash()
    ↓
GitDiffAnalyzer.analyzeCommitDiff()
    ├─ git diff --name-only HEAD~1 HEAD
    ├─ git show HEAD~1:file.py (旧内容)
    └─ git show HEAD:file.py (新内容)
    ↓
构建 CodeChange[]
    ↓
AnalyzeMaintenanceRequest {
  commit_hash: "abc123",
  previous_commit_hash: "def456",
  changes: [CodeChange, ...]
}
    ↓
MaintenanceBackendClient.analyzeMaintenance()
    ↓
POST /maintenance/analyze
    ↓
后端返回 AnalyzeMaintenanceResponse
    ↓
构建 MaintenanceResult
    ↓
更新UI (TreeProvider.refresh())
```

### 响应数据流

```
后端返回
    ↓
AnalyzeMaintenanceResponse {
  context_id: "ctx-123",
  affected_tests: [AffectedTestCase, ...],
  change_summary: ChangeSummary
}
    ↓
MaintenanceResult {
  context_id,
  commit_hash,
  previous_commit_hash,
  affected_tests,
  change_summary,
  code_changes,
  timestamp
}
    ↓
TreeProvider.refresh(result)
    ↓
显示在Activity Bar树形视图中
    ↓
用户点击查看详情
    ↓
跳转到代码位置或显示差异
```

---

## 🔗 组件交互图

```
┌─────────────────┐
│  Extension.ts   │
│  (主入口)        │
└────────┬────────┘
         │ 初始化
         ▼
┌─────────────────────────────────────┐
│  AnalyzeMaintenanceCommand          │
│  ┌───────────────────────────────┐  │
│  │ execute()                     │  │
│  │ 1. GitCommitWatcher           │  │
│  │ 2. GitDiffAnalyzer            │  │
│  │ 3. MaintenanceBackendClient   │  │
│  │ 4. MaintenanceTreeProvider    │  │
│  │ 5. DiffViewer                 │  │
│  │ 6. DecisionDialogManager      │  │
│  └───────────────────────────────┘  │
└────────┬────────────────────────────┘
         │
         ├─→ GitCommitWatcher
         │   └─→ execSync('git rev-parse HEAD')
         │
         ├─→ GitDiffAnalyzer
         │   ├─→ execSync('git diff --name-only')
         │   ├─→ execSync('git show HEAD~1:file')
         │   └─→ execSync('git show HEAD:file')
         │
         ├─→ MaintenanceBackendClient
         │   └─→ axios.post('/maintenance/analyze')
         │
         ├─→ MaintenanceTreeProvider
         │   └─→ refresh(result)
         │
         ├─→ DiffViewer
         │   └─→ vscode.commands.executeCommand('vscode.diff')
         │
         └─→ DecisionDialogManager
             └─→ vscode.window.showInformationMessage()
```

---

## 🔌 后端接口对接

### API客户端实现 (`api/maintenanceClient.ts`)

**配置读取**：

```41:48:src/maintenance/api/maintenanceClient.ts
	private getBackendUrl(): string {
		const config = vscode.workspace.getConfiguration('llt-assistant');
		// Use maintenance-specific URL if configured, otherwise fall back to main backend URL
		return (
			config.get('maintenance.backendUrl') ||
			config.get('backendUrl', 'https://llt-assistant.fly.dev/api/v1')
		);
	}
```

**优先级**：
1. `llt-assistant.maintenance.backendUrl` (维护专用URL)
2. `llt-assistant.backendUrl` (主后端URL)
3. 默认值：`https://llt-assistant.fly.dev/api/v1`

**API方法**：

```typescript
// 1. 健康检查
async checkHealth(): Promise<boolean>
// GET /health

// 2. 分析维护
async analyzeMaintenance(request: AnalyzeMaintenanceRequest): Promise<AnalyzeMaintenanceResponse>
// POST /maintenance/analyze

// 3. 批量修复
async batchFixTests(request: BatchFixRequest): Promise<BatchFixResponse>
// POST /maintenance/batch-fix

// 4. 获取代码差异
async getCodeDiff(request: GetCodeDiffRequest): Promise<GetCodeDiffResponse>
// POST /maintenance/code-diff
```

---

### 接口规范

#### POST /maintenance/analyze

**请求示例**：
```json
{
  "commit_hash": "abc123def456...",
  "previous_commit_hash": "def456abc123...",
  "changes": [
    {
      "file_path": "src/calculator.py",
      "old_content": "def add(a, b):\n    return a + b",
      "new_content": "def add(a, b):\n    if a < 0 or b < 0:\n        raise ValueError('Negative not supported')\n    return a + b",
      "changed_functions": ["add"],
      "lines_added": 2,
      "lines_removed": 1
    }
  ],
  "client_metadata": {
    "extension_version": "0.0.1",
    "vscode_version": "1.85.0",
    "platform": "win32"
  }
}
```

**响应示例**：
```json
{
  "context_id": "ctx-123456",
  "affected_tests": [
    {
      "test_file": "tests/test_calculator.py",
      "test_name": "test_add",
      "test_class": "TestCalculator",
      "impact_level": "high",
      "reason": "Function behavior changed - added validation",
      "requires_update": true,
      "line_number": 15,
      "source_file": "src/calculator.py",
      "source_function": "add"
    }
  ],
  "change_summary": {
    "files_changed": 1,
    "functions_changed": ["add"],
    "lines_added": 2,
    "lines_removed": 1,
    "change_type": "feature_addition"
  }
}
```

---

## 🎨 UI组件详解

### 1. 树形视图 (`maintenanceTreeProvider.ts`)

**树形结构实现**：

```typescript
getChildren(element?: MaintenanceTreeItem): Promise<MaintenanceTreeItem[]>
```

**层级结构**：
- **根级**：Summary + 测试文件列表
- **文件级**：测试用例列表
- **用例级**：无子节点（叶子节点）

**图标和颜色**：
- 🔴 Critical - 红色
- 🟠 High - 橙色
- 🟡 Medium - 黄色
- 🔵 Low - 蓝色

### 2. 差异查看器 (`diffViewer.ts`)

**实现方式**：
- 使用VSCode内置的 `vscode.diff` 命令
- 创建临时URI用于显示旧内容和新内容
- 支持并排对比视图

### 3. 决策对话框 (`decisionDialog.ts`)

**交互组件**：
- `vscode.window.showInformationMessage()` - 主决策对话框
- `vscode.window.showInputBox()` - 功能描述输入
- `vscode.window.showQuickPick()` - 多选测试用例

---

## ⚙️ 配置与扩展

### 配置项 (`package.json`)

```json
{
  "llt-assistant.maintenance.backendUrl": {
    "type": "string",
    "default": "https://llt-assistant.fly.dev/api/v1",
    "description": "Backend API URL for maintenance operations"
  },
  "llt-assistant.maintenance.autoAnalyze": {
    "type": "boolean",
    "default": false,
    "description": "Automatically analyze maintenance when new commit is detected"
  },
  "llt-assistant.maintenance.watchCommits": {
    "type": "boolean",
    "default": true,
    "description": "Watch for new Git commits and notify user"
  }
}
```

### 命令注册 (`package.json`)

```json
{
  "command": "llt-assistant.analyzeMaintenance",
  "title": "LLT: Analyze Maintenance",
  "icon": "$(git-commit)"
}
```

### 视图注册 (`package.json`)

```json
{
  "id": "llt-maintenance",
  "title": "LLT Maintenance",
  "icon": "resources/icons/llt-icon.svg"
}
```

---

## 🔍 关键设计决策

### 1. 为什么使用轮询而不是Git Hook？

**原因**：
- Git Hook需要修改Git配置，可能影响用户环境
- 前端扩展无法直接安装Git Hook
- 轮询方式更安全，不修改用户Git配置

**实现**：
- 默认每5秒轮询一次 `git rev-parse HEAD`
- 可配置轮询间隔
- 也支持文件系统监听（但不如轮询可靠）

### 2. 为什么分离分析和修复流程？

**原因**：
- 用户可能需要先查看分析结果再决定是否修复
- 修复操作可能很耗时，分离可以避免阻塞
- 支持多次修复（如果第一次不满意）

### 3. 为什么需要用户决策？

**原因**：
- 功能变更和重构需要不同的处理方式
- 功能变更：需要重新生成测试（使用新功能描述）
- 仅重构：只需要提升覆盖率（保持原有功能）

---

## 📈 性能考虑

### 优化点

1. **差异分析**：
   - 只分析Python文件（`.py`）
   - 排除测试文件（`test_*.py`）
   - 使用正则表达式快速提取函数名

2. **Git操作**：
   - 缓存提交哈希
   - 批量获取文件内容
   - 使用 `git diff --name-only` 先获取文件列表

3. **UI更新**：
   - 使用 `setTimeout` 延迟显示diff（非阻塞）
   - 树形视图按需加载子节点
   - 进度反馈避免用户等待焦虑

---

## 🧪 测试要点

### 需要测试的场景

1. **Git操作**：
   - 无Git仓库
   - 只有一个提交（无HEAD~1）
   - 无代码变更
   - 大量文件变更

2. **后端通信**：
   - 后端不可用
   - 网络超时
   - API返回错误
   - 空响应

3. **用户交互**：
   - 用户取消操作
   - 用户不选择任何测试
   - 用户输入空描述

---

## 🎯 总结

### 模块特点

1. **模块化设计**：清晰的层次结构，易于维护
2. **用户友好**：完整的进度反馈和错误处理
3. **灵活配置**：支持多种配置选项
4. **可扩展性**：易于添加新功能

### 核心价值

- **自动化**：自动检测代码变更
- **智能化**：后端AI识别受影响的测试
- **可视化**：清晰的UI展示分析结果
- **可操作**：一键批量修复测试用例

---

## 📚 相关文档

- [快速开始指南](./QUICK_START.md)
- [使用指南](./USAGE_GUIDE.md)
- [模块解析](./MODULE_ANALYSIS.md)
- [故障排查](./TROUBLESHOOTING.md)


# 动态维护模块代码解析

## 模块架构概览

动态维护模块位于 `src/maintenance/` 目录，包含以下子模块：

```
src/maintenance/
├── api/              # 后端API客户端
├── git/              # Git操作（提交监控、差异分析）
├── ui/               # 用户界面组件
├── commands/         # 命令处理器
└── models/           # 数据模型和类型定义
```

---

## 核心模块解析

### 1. API客户端模块 (`api/maintenanceClient.ts`)

**功能**：负责与后端API通信

**关键方法**：

```typescript
// 健康检查
async checkHealth(): Promise<boolean>
// 调用: GET /health

// 分析维护 - 识别受影响的测试用例
async analyzeMaintenance(request: AnalyzeMaintenanceRequest): Promise<AnalyzeMaintenanceResponse>
// 调用: POST /maintenance/analyze

// 批量修复测试
async batchFixTests(request: BatchFixRequest): Promise<BatchFixResponse>
// 调用: POST /maintenance/batch-fix

// 获取代码差异
async getCodeDiff(request: GetCodeDiffRequest): Promise<GetCodeDiffResponse>
// 调用: POST /maintenance/code-diff
```

**配置读取**：
- 优先读取 `llt-assistant.maintenance.backendUrl`
- 如果未配置，回退到 `llt-assistant.backendUrl`
- 默认值：`https://llt-assistant.fly.dev/api/v1`

---

### 2. Git监控模块 (`git/commitWatcher.ts`)

**功能**：监控Git仓库的新提交

**关键方法**：

```typescript
// 开始监控
startWatching(
  onCommitDetected: (comparison: CommitComparison) => void,
  usePolling: boolean = true,
  pollInterval: number = 5000
): void

// 获取当前提交哈希
getCurrentCommitHash(): string | null

// 获取上一个提交哈希
getPreviousCommitHash(): string | null

// 比较两个提交
compareCommits(previousHash: string, currentHash: string): CommitComparison
```

**监控方式**：
- **轮询模式**（默认）：每5秒检查一次新提交
- **文件监听模式**：监听 `.git/HEAD` 和 `.git/refs/heads/**` 文件变化

---

### 3. 差异分析模块 (`git/diffAnalyzer.ts`)

**功能**：分析两次提交之间的代码差异

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
- 识别变更的文件
- 提取变更的函数
- 计算增删行数
- 生成统一diff格式
- 判断变更类型（重构/功能添加/修复/破坏性变更）

---

### 4. UI组件模块

#### 4.1 树形视图 (`ui/maintenanceTreeProvider.ts`)

**功能**：在Activity Bar中显示受影响的测试用例

**显示结构**：
```
📊 Summary
  ├─ 📝 X files changed
  ├─ 🧪 Y tests affected
  └─ 📏 +A / -B lines
📄 test_file1.py
  ├─ 🔴 test_function1 [CRITICAL]
  └─ 🟡 test_function2 [MEDIUM]
```

#### 4.2 差异查看器 (`ui/diffViewer.ts`)

**功能**：使用VSCode内置diff编辑器展示代码变更

**方法**：
```typescript
// 显示并排对比
static async showDiff(diff: CodeDiff, title?: string): Promise<void>

// 显示统一diff
static async showUnifiedDiff(diff: CodeDiff): Promise<void>
```

#### 4.3 决策对话框 (`ui/decisionDialog.ts`)

**功能**：询问用户功能是否发生变更

**流程**：
1. 展示变更摘要
2. 询问："功能是否发生变更？"
3. 如果选择"是"：
   - 提示输入新功能描述
   - 选择要重新生成的测试
4. 如果选择"否"：
   - 选择要提升覆盖率的测试

---

### 5. 命令模块

#### 5.1 分析命令 (`commands/analyzeMaintenance.ts`)

**执行流程**：

```
1. 检查后端健康状态
   ↓
2. 获取当前和上一个提交哈希
   ↓
3. 分析提交差异（提取代码变更）
   ↓
4. 准备API请求
   ↓
5. 调用后端API识别受影响的测试
   ↓
6. 构建分析结果
   ↓
7. 更新树形视图
   ↓
8. 展示差异并询问用户决策
```

#### 5.2 批量修复命令 (`commands/batchFix.ts`)

**执行流程**：

```
根据用户决策：
├─ 功能变更 → 重新生成测试
│   ├─ 分析源函数
│   ├─ 调用测试生成API
│   └─ 插入新测试代码
│
└─ 仅重构 → 提升覆盖率
    └─ 调用后端批量修复API
```

---

## 数据流

```
Git提交监控
    ↓
检测到新提交
    ↓
提取代码差异 (diffAnalyzer)
    ↓
调用后端API (maintenanceClient.analyzeMaintenance)
    ↓
后端返回受影响的测试用例
    ↓
更新UI (treeProvider.refresh)
    ↓
展示差异 (diffViewer.showDiff)
    ↓
用户决策 (decisionDialog.showDecisionDialog)
    ↓
批量修复 (batchFix.execute)
```

---

## API接口规范

### 1. POST /maintenance/analyze

**请求体**：
```json
{
  "commit_hash": "abc123...",
  "previous_commit_hash": "def456...",
  "changes": [
    {
      "file_path": "src/calculator.py",
      "old_content": "...",
      "new_content": "...",
      "changed_functions": ["add", "subtract"],
      "lines_added": 10,
      "lines_removed": 5
    }
  ],
  "client_metadata": {
    "extension_version": "0.0.1",
    "vscode_version": "1.85.0",
    "platform": "win32"
  }
}
```

**响应**：
```json
{
  "context_id": "ctx-123",
  "affected_tests": [
    {
      "test_file": "tests/test_calculator.py",
      "test_name": "test_add",
      "test_class": "TestCalculator",
      "impact_level": "high",
      "reason": "Function signature changed",
      "requires_update": true,
      "line_number": 15,
      "source_file": "src/calculator.py",
      "source_function": "add"
    }
  ],
  "change_summary": {
    "files_changed": 2,
    "functions_changed": ["add", "subtract"],
    "lines_added": 50,
    "lines_removed": 20,
    "change_type": "feature_addition"
  }
}
```

### 2. POST /maintenance/batch-fix

**请求体**：
```json
{
  "action": "regenerate" | "improve_coverage",
  "tests": [
    {
      "test_file": "tests/test_calculator.py",
      "test_name": "test_add",
      "test_class": "TestCalculator",
      "function_name": "add",
      "source_file": "src/calculator.py"
    }
  ],
  "user_description": "Added support for negative numbers",
  "client_metadata": {...}
}
```

**响应**：
```json
{
  "success": true,
  "processed_count": 1,
  "results": [
    {
      "test_file": "tests/test_calculator.py",
      "test_name": "test_add",
      "success": true,
      "new_code": "def test_add():\n    ..."
    }
  ]
}
```

### 3. POST /maintenance/code-diff

**请求体**：
```json
{
  "file_path": "src/calculator.py",
  "old_content": "...",
  "new_content": "..."
}
```

**响应**：
```json
{
  "unified_diff": "diff --git a/...",
  "changed_functions": ["add"],
  "lines_added": 10,
  "lines_removed": 5
}
```

---

## 配置说明

在 `package.json` 中已添加以下配置项：

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


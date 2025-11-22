<!-- cdf3fb97-b4ca-4d7e-99e7-048270ef882f 303c9154-8ca8-40ad-b24a-7804c4296e6d -->
# 动态维护模块实现计划

## 模块概述

动态维护模块用于实时监控代码变更（基于Git），自动识别受影响的测试用例，并提供批量修复功能。核心流程：

1. 监控Git提交变更（对比上一次提交）
2. 识别受影响的测试用例
3. 展示变动前后差异
4. 询问用户功能是否发生变更
5. 根据用户选择执行相应操作（重新生成测试 或 提高覆盖率）

## 架构设计

### 目录结构

```
src/maintenance/
├── index.ts                    # 模块导出
├── api/
│   ├── index.ts
│   ├── maintenanceClient.ts    # 后端API客户端
│   └── types.ts                 # API类型定义
├── git/
│   ├── index.ts
│   ├── commitWatcher.ts        # Git提交监控器
│   └── diffAnalyzer.ts         # 提交差异分析器
├── ui/
│   ├── index.ts
│   ├── maintenanceTreeProvider.ts  # 树形视图提供者
│   ├── diffViewer.ts            # 差异查看器
│   └── decisionDialog.ts        # 决策对话框
├── commands/
│   ├── index.ts
│   ├── analyzeMaintenance.ts    # 分析命令
│   └── batchFix.ts              # 批量修复命令
└── models/
    ├── index.ts
    └── types.ts                 # 数据模型类型
```

## 实现步骤

### 阶段1: 基础架构和类型定义

#### 1.1 创建类型定义 (`src/maintenance/models/types.ts`)

- `MaintenanceResult`: 维护分析结果
- `AffectedTestCase`: 受影响的测试用例
- `CodeDiff`: 代码差异信息
- `UserDecision`: 用户决策结果
- `MaintenanceStatus`: 维护状态枚举

#### 1.2 创建API类型定义 (`src/maintenance/api/types.ts`)

- `AnalyzeMaintenanceRequest`: 分析请求
- `AnalyzeMaintenanceResponse`: 分析响应
- `BatchFixRequest`: 批量修复请求
- `BatchFixResponse`: 批量修复响应

### 阶段2: Git监控和差异分析

#### 2.1 Git提交监控器 (`src/maintenance/git/commitWatcher.ts`)

- 监听Git提交事件（通过文件系统监听或定期轮询）
- 检测新提交（对比HEAD和HEAD~1）
- 触发变更分析

#### 2.2 差异分析器 (`src/maintenance/git/diffAnalyzer.ts`)

- 提取两次提交之间的差异
- 识别变更的文件和函数
- 计算变更统计信息（增删行数等）

### 阶段3: 后端API客户端

#### 3.1 维护API客户端 (`src/maintenance/api/maintenanceClient.ts`)

- `analyzeMaintenance()`: 分析受影响的测试用例
- `batchFixTests()`: 批量修复测试用例
- `getCodeDiff()`: 获取代码差异详情
- 错误处理和重试逻辑

### 阶段4: UI组件

#### 4.1 树形视图提供者 (`src/maintenance/ui/maintenanceTreeProvider.ts`)

- 显示受影响的测试用例列表
- 按文件分组显示
- 显示变更状态和影响级别
- 支持点击跳转到代码位置

#### 4.2 差异查看器 (`src/maintenance/ui/diffViewer.ts`)

- 展示变更前后的代码差异
- 使用VSCode内置diff编辑器
- 高亮显示变更的函数
- 支持并排对比视图

#### 4.3 决策对话框 (`src/maintenance/ui/decisionDialog.ts`)

- 展示变更摘要
- 询问用户："功能是否发生变更？"
- 选项1: "是，功能变更" → 引导重新填写功能描述
- 选项2: "否，仅重构" → 引导提高覆盖率
- 选项3: "取消"

### 阶段5: 命令实现

#### 5.1 分析命令 (`src/maintenance/commands/analyzeMaintenance.ts`)

- 执行维护分析流程
- 调用Git差异分析
- 调用后端API识别受影响测试
- 更新树形视图

#### 5.2 批量修复命令 (`src/maintenance/commands/batchFix.ts`)

- 根据用户决策执行相应操作
- 功能变更：调用测试生成API重新生成
- 仅重构：调用覆盖率优化API提高覆盖率
- 显示进度和结果

### 阶段6: 扩展集成

#### 6.1 注册到主扩展 (`src/extension.ts`)

- 注册Activity Bar视图
- 注册命令
- 注册文件监听器
- 注册Git提交监听器

#### 6.2 更新package.json

- 添加新命令定义
- 添加视图容器和视图
- 添加菜单项
- 添加配置选项

## 关键功能点

### 1. Git提交监控

- 使用VSCode文件系统监听器监控`.git`目录
- 或使用定期轮询检查新提交
- 检测到新提交时自动触发分析

### 2. 差异展示

- 使用VSCode的`vscode.diff`命令打开diff视图
- 展示变更前后的完整代码对比
- 高亮显示变更的函数

### 3. 用户决策流程

```
检测到变更
  ↓
展示差异
  ↓
询问："功能是否发生变更？"
  ↓
[是] → 输入新功能描述 → 重新生成测试
  ↓
[否] → 提高覆盖率
  ↓
[取消] → 结束
```

### 4. 批量修复

- 支持选择多个测试用例批量处理
- 显示处理进度
- 提供预览和确认机制

## 配置选项

在`package.json`中添加：

- `llt-assistant.maintenance.autoAnalyze`: 自动分析新提交（默认: false）
- `llt-assistant.maintenance.backendUrl`: 维护API后端URL
- `llt-assistant.maintenance.watchCommits`: 监听Git提交（默认: true）

## 后端API接口规范（待对接）

### POST /api/v1/maintenance/analyze

请求体：

```json
{
  "commit_hash": "abc123",
  "previous_commit_hash": "def456",
  "changes": [
    {
      "file_path": "src/calculator.py",
      "old_content": "...",
      "new_content": "...",
      "changed_functions": ["add", "subtract"]
    }
  ]
}
```

响应：

```json
{
  "affected_tests": [
    {
      "test_file": "tests/test_calculator.py",
      "test_name": "test_add",
      "impact_level": "high",
      "reason": "Function signature changed"
    }
  ],
  "change_summary": {
    "files_changed": 2,
    "functions_changed": 3,
    "lines_added": 50,
    "lines_removed": 20
  }
}
```

### POST /api/v1/maintenance/batch-fix

请求体：

```json
{
  "action": "regenerate" | "improve_coverage",
  "tests": [
    {
      "test_file": "tests/test_calculator.py",
      "test_name": "test_add",
      "function_name": "add",
      "source_file": "src/calculator.py"
    }
  ],
  "user_description": "..." // 仅当action为regenerate时
}
```

## 测试要点

1. Git提交检测准确性
2. 差异提取正确性
3. UI交互流程完整性
4. 错误处理健壮性
5. 性能（大量文件变更时的响应速度）

## 注意事项

1. Git Hook在前端无法直接实现，需要通过文件监听或轮询模拟
2. 需要处理Git仓库不存在的情况
3. 需要处理无提交历史的情况
4. 批量操作需要考虑性能，可能需要分批处理
5. 用户取消操作时需要清理状态

### To-dos

- [ ] 创建基础目录结构和类型定义文件（models/types.ts, api/types.ts）
- [ ] 实现Git提交监控器（commitWatcher.ts）- 监听新提交事件
- [ ] 实现差异分析器（diffAnalyzer.ts）- 提取两次提交之间的差异
- [ ] 实现后端API客户端（maintenanceClient.ts）- 定义接口方法
- [ ] 实现树形视图提供者（maintenanceTreeProvider.ts）- 显示受影响测试用例
- [ ] 实现差异查看器（diffViewer.ts）- 展示变更前后代码对比
- [ ] 实现决策对话框（decisionDialog.ts）- 询问用户功能是否变更
- [ ] 实现分析命令（analyzeMaintenance.ts）- 执行维护分析流程
- [ ] 实现批量修复命令（batchFix.ts）- 根据用户决策执行操作
- [ ] 在extension.ts中注册新模块（视图、命令、监听器）
- [ ] 更新package.json（命令、视图、菜单、配置）
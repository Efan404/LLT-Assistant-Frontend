# 动态维护模块 - 快速对接指南

## 📋 目录

- [快速开始](#快速开始)
- [代码模块解析](#代码模块解析)
- [API接口对接](#api接口对接)
- [功能使用](#功能使用)
- [故障排查](#故障排查)

---

## 🚀 快速开始

### 1. 配置后端URL（3步完成）

#### 步骤1：打开设置
- 按 `Ctrl+,` (Windows) 或 `Cmd+,` (Mac)

#### 步骤2：搜索配置
- 输入：`llt-assistant.maintenance.backendUrl`

#### 步骤3：设置值
- 设置为：`https://cs5351.efan.dev/api/v1`

**或者直接编辑 `.vscode/settings.json`：**

```json
{
  "llt-assistant.maintenance.backendUrl": "https://cs5351.efan.dev/api/v1"
}
```

### 2. 编译扩展

```bash
pnpm install
pnpm run compile
```

### 3. 测试连接

按 `F5` 启动扩展开发主机，然后：
1. 按 `Ctrl+Shift+P`
2. 输入 `LLT: Analyze Maintenance`
3. 查看是否成功连接

---

## 📚 代码模块解析

### 模块结构

```
src/maintenance/
├── api/                    # 后端API客户端
│   ├── maintenanceClient.ts   # 主要API调用逻辑
│   └── types.ts              # API类型定义
├── git/                    # Git操作
│   ├── commitWatcher.ts      # 提交监控
│   └── diffAnalyzer.ts       # 差异分析
├── ui/                     # 用户界面
│   ├── maintenanceTreeProvider.ts  # 树形视图
│   ├── diffViewer.ts             # 差异查看器
│   └── decisionDialog.ts         # 决策对话框
├── commands/               # 命令处理器
│   ├── analyzeMaintenance.ts    # 分析命令
│   └── batchFix.ts             # 批量修复命令
└── models/                 # 数据模型
    └── types.ts            # 类型定义
```

### 核心流程

```
1. Git提交监控 (commitWatcher)
   ↓
2. 检测到新提交
   ↓
3. 提取代码差异 (diffAnalyzer)
   ↓
4. 调用后端API (maintenanceClient.analyzeMaintenance)
   ↓
5. 后端返回受影响的测试用例
   ↓
6. 更新UI显示 (treeProvider)
   ↓
7. 展示代码差异 (diffViewer)
   ↓
8. 用户决策 (decisionDialog)
   ↓
9. 批量修复 (batchFix)
```

详细解析请查看：[模块解析文档](./MODULE_ANALYSIS.md)

---

## 🔌 API接口对接

### 你的后端需要实现3个接口

#### 1. 健康检查

```
GET https://cs5351.efan.dev/api/v1/health
```

**响应**：
```json
{
  "status": "ok"
}
```

#### 2. 分析维护

```
POST https://cs5351.efan.dev/api/v1/maintenance/analyze
```

**请求体**：
```json
{
  "commit_hash": "abc123...",
  "previous_commit_hash": "def456...",
  "changes": [
    {
      "file_path": "src/example.py",
      "old_content": "def add(a, b):\n    return a + b",
      "new_content": "def add(a, b):\n    if a < 0:\n        raise ValueError()\n    return a + b",
      "changed_functions": ["add"],
      "lines_added": 2,
      "lines_removed": 1
    }
  ]
}
```

**响应**：
```json
{
  "context_id": "ctx-123",
  "affected_tests": [
    {
      "test_file": "tests/test_example.py",
      "test_name": "test_add",
      "impact_level": "high",
      "reason": "Function behavior changed",
      "requires_update": true,
      "line_number": 10,
      "source_file": "src/example.py",
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

#### 3. 批量修复

```
POST https://cs5351.efan.dev/api/v1/maintenance/batch-fix
```

**请求体**：
```json
{
  "action": "regenerate",
  "tests": [
    {
      "test_file": "tests/test_example.py",
      "test_name": "test_add",
      "function_name": "add",
      "source_file": "src/example.py"
    }
  ],
  "user_description": "Added validation for negative numbers"
}
```

**响应**：
```json
{
  "success": true,
  "processed_count": 1,
  "results": [
    {
      "test_file": "tests/test_example.py",
      "test_name": "test_add",
      "success": true,
      "new_code": "def test_add():\n    assert add(1, 2) == 3\n    with pytest.raises(ValueError):\n        add(-1, 2)"
    }
  ]
}
```

详细接口规范请查看：[API接口规范](./MODULE_ANALYSIS.md#api接口规范)

---

## 🎯 功能使用

### 方式一：通过Activity Bar（推荐）

1. **打开维护视图**
   - 点击左侧Activity Bar的 **"LLT Maintenance"** 图标

2. **执行分析**
   - 点击视图顶部的 **"Analyze Maintenance"** 按钮

3. **查看结果**
   - 树形视图显示受影响的测试用例
   - 自动打开代码差异视图

4. **做出决策**
   - 选择"功能是否变更"
   - 输入描述（如果选择"是"）
   - 选择要修复的测试

5. **批量修复**
   - 点击 **"Batch Fix Tests"** 按钮

### 方式二：通过命令面板

按 `Ctrl+Shift+P`，然后输入：
- `LLT: Analyze Maintenance` - 分析维护
- `LLT: Batch Fix Tests` - 批量修复
- `LLT: Refresh Maintenance View` - 刷新视图
- `LLT: Clear Maintenance` - 清除结果

详细使用指南请查看：[使用指南](./USAGE_GUIDE.md)

---

## 🔍 查看功能

### 1. 查看UI界面

- **Activity Bar**：左侧的 "LLT Maintenance" 图标
- **树形视图**：显示分析结果
- **Diff视图**：自动打开的代码对比

### 2. 查看日志

- 按 `Ctrl+Shift+U` 打开输出面板
- 选择 "LLT Assistant" 查看详细日志

### 3. 测试功能

1. 确保项目是Git仓库
2. 至少有2个提交
3. 有Python源代码和测试文件
4. 执行 `LLT: Analyze Maintenance`

---

## 🛠️ 故障排查

### 问题1：无法连接后端

**检查清单**：
- ✅ 后端URL配置是否正确：`https://cs5351.efan.dev/api/v1`
- ✅ 网络连接是否正常
- ✅ 后端服务是否运行
- ✅ 测试健康检查接口：`curl https://cs5351.efan.dev/api/v1/health`

### 问题2：没有检测到变更

**检查清单**：
- ✅ 是否有至少2个Git提交
- ✅ 修改的是否是Python文件（`.py`）
- ✅ 是否在Git仓库中

### 问题3：分析结果为空

**可能原因**：
- 后端API返回空结果
- 测试文件命名不符合规范
- 代码变更与测试无关联

### 问题4：查看详细错误

1. 打开输出面板（`Ctrl+Shift+U`）
2. 选择 "LLT Assistant"
3. 查看错误日志

---

## 📖 相关文档

- [快速开始指南](./QUICK_START.md) - 5分钟快速上手
- [使用指南](./USAGE_GUIDE.md) - 详细功能说明
- [模块解析](./MODULE_ANALYSIS.md) - 代码架构详解

---

## 💡 提示

1. **首次使用**：建议先测试健康检查接口确保连接正常
2. **调试模式**：按 `F5` 启动扩展开发主机，可以查看详细日志
3. **配置优先级**：工作区配置 > 用户配置 > 默认配置
4. **自动监控**：可以在设置中启用 `watchCommits` 自动检测新提交

---

## 🎉 开始使用

1. ✅ 配置后端URL：`https://cs5351.efan.dev/api/v1`
2. ✅ 编译扩展：`pnpm run compile`
3. ✅ 按 `F5` 启动扩展开发主机
4. ✅ 执行 `LLT: Analyze Maintenance`
5. ✅ 查看结果并测试功能

祝你使用愉快！🚀


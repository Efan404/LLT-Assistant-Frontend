# 动态维护功能使用指南

## 快速开始

### 1. 配置后端接口

#### 方法一：通过VSCode设置界面

1. 打开VSCode设置（`Ctrl+,` 或 `Cmd+,`）
2. 搜索 `llt-assistant.maintenance.backendUrl`
3. 设置为：`https://cs5351.efan.dev/api/v1`
4. 保存设置

#### 方法二：直接编辑settings.json

1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (Mac)
2. 输入 `Preferences: Open User Settings (JSON)`
3. 添加以下配置：

```json
{
  "llt-assistant.maintenance.backendUrl": "https://cs5351.efan.dev/api/v1"
}
```

#### 方法三：工作区配置（推荐）

在项目根目录创建或编辑 `.vscode/settings.json`：

```json
{
  "llt-assistant.maintenance.backendUrl": "https://cs5351.efan.dev/api/v1",
  "llt-assistant.maintenance.autoAnalyze": false,
  "llt-assistant.maintenance.watchCommits": true
}
```

---

## 功能使用

### 方式一：通过Activity Bar

1. **打开维护视图**
   - 点击左侧Activity Bar中的 **"LLT Maintenance"** 图标
   - 或使用命令面板：`Ctrl+Shift+P` → 输入 `View: Show LLT Maintenance`

2. **执行分析**
   - 在维护视图中，点击顶部的 **"Analyze Maintenance"** 按钮
   - 或使用命令：`LLT: Analyze Maintenance`

3. **查看结果**
   - 分析完成后，树形视图会显示：
     - 📊 摘要信息（文件数、测试数、行数变更）
     - 📄 受影响的测试文件列表
     - 🧪 具体的测试用例（带影响级别标识）

4. **查看差异**
   - 分析完成后会自动打开第一个变更文件的diff视图
   - 可以查看变更前后的代码对比

5. **做出决策**
   - 系统会弹出对话框询问："功能是否发生变更？"
   - **选择 "Yes, functionality changed"**：
     - 输入新功能描述
     - 选择要重新生成的测试用例
   - **选择 "No, just refactoring"**：
     - 选择要提升覆盖率的测试用例
   - **选择 "Cancel"**：
     - 取消操作

6. **批量修复**
   - 在维护视图中，点击 **"Batch Fix Tests"** 按钮
   - 或使用命令：`LLT: Batch Fix Tests`
   - 系统会根据之前的决策执行相应操作

---

### 方式二：通过命令面板

1. **打开命令面板**：`Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (Mac)

2. **可用命令**：
   - `LLT: Analyze Maintenance` - 分析维护
   - `LLT: Refresh Maintenance View` - 刷新视图
   - `LLT: Clear Maintenance` - 清除分析结果
   - `LLT: Batch Fix Tests` - 批量修复测试

---

## 自动监控（可选）

### 启用自动监控

在设置中启用：

```json
{
  "llt-assistant.maintenance.watchCommits": true,
  "llt-assistant.maintenance.autoAnalyze": false
}
```

**说明**：
- `watchCommits: true` - 监听Git提交，检测到新提交时通知用户
- `autoAnalyze: false` - 不自动分析，只通知（推荐）
- `autoAnalyze: true` - 检测到新提交时自动执行分析

---

## 完整使用流程示例

### 场景：修改了计算器函数，需要更新测试

1. **修改代码并提交**
   ```bash
   # 修改 src/calculator.py
   git add src/calculator.py
   git commit -m "Add support for negative numbers"
   ```

2. **执行维护分析**
   - 打开维护视图
   - 点击 "Analyze Maintenance"
   - 等待分析完成

3. **查看分析结果**
   - 看到受影响的测试用例列表
   - 查看代码差异（自动打开diff视图）

4. **做出决策**
   - 选择 "Yes, functionality changed"
   - 输入描述："Added support for negative numbers in add function"
   - 选择要更新的测试用例（如 `test_add`）

5. **执行批量修复**
   - 点击 "Batch Fix Tests"
   - 系统会重新生成选中的测试用例
   - 查看生成的新测试代码

---

## 功能特性

### 1. 智能差异分析
- 自动识别变更的函数
- 计算增删行数
- 判断变更类型（重构/功能添加/修复）

### 2. 影响级别标识
- 🔴 **Critical** - 关键影响，必须更新
- 🟠 **High** - 高影响，建议更新
- 🟡 **Medium** - 中等影响
- 🔵 **Low** - 低影响

### 3. 可视化展示
- 树形视图按文件分组
- 点击测试用例可跳转到代码位置
- 支持并排diff对比

### 4. 批量操作
- 支持选择多个测试用例
- 批量重新生成或提升覆盖率
- 显示处理进度

---

## 故障排查

### 问题1：无法连接到后端

**症状**：提示 "Backend is not responding"

**解决方案**：
1. 检查后端URL配置是否正确
2. 检查网络连接
3. 验证后端服务是否运行：访问 `https://cs5351.efan.dev/api/v1/health`

### 问题2：没有检测到变更

**症状**：提示 "No code changes detected"

**解决方案**：
1. 确保已提交代码（有至少2个提交）
2. 确保修改的是Python文件（`.py`）
3. 检查是否在Git仓库中

### 问题3：分析结果为空

**症状**：分析完成但没有受影响的测试

**可能原因**：
- 后端API返回空结果
- 测试文件命名不符合规范（应为 `test_*.py`）
- 代码变更与测试用例无关联

### 问题4：批量修复失败

**症状**：部分或全部测试修复失败

**解决方案**：
1. 查看错误消息了解具体原因
2. 检查测试文件路径是否正确
3. 检查源文件是否存在
4. 查看VSCode输出面板的日志

---

## 查看日志

### 打开输出面板

1. 按 `Ctrl+Shift+U` (Windows/Linux) 或 `Cmd+Shift+U` (Mac)
2. 在输出面板的下拉菜单中选择 "LLT Assistant"
3. 查看详细的执行日志

### 常见日志信息

- `[Maintenance] Health check failed` - 后端连接失败
- `[Maintenance] Error analyzing file` - 文件分析错误
- `[Maintenance] Error during analysis` - 分析过程错误

---

## 最佳实践

1. **定期分析**：每次提交代码后执行一次维护分析
2. **及时修复**：发现受影响的测试用例后尽快修复
3. **查看差异**：修复前先查看代码差异，确保理解变更
4. **选择性修复**：只修复真正需要更新的测试用例
5. **验证结果**：修复后运行测试确保通过

---

## 快捷键

- `Ctrl+Shift+P` / `Cmd+Shift+P` - 打开命令面板
- `Ctrl+,` / `Cmd+,` - 打开设置
- `Ctrl+Shift+U` / `Cmd+Shift+U` - 打开输出面板

---

## 下一步

- 查看 [API接口规范](./MODULE_ANALYSIS.md#api接口规范) 了解后端接口详情
- 查看 [模块架构](./MODULE_ANALYSIS.md) 了解代码实现细节


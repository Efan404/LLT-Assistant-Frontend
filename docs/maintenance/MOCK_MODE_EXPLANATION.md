# Mock模式说明

## 🎯 为什么需要Mock模式？

你负责**前端部分**，还没有连接后端接口，所以：

- ✅ **前端UI**：可以正常显示
- ✅ **Mock数据**：自动生成模拟数据
- ❌ **真实后端**：暂时不需要

Mock模式就是为了让你**在没有后端的情况下测试前端功能**。

---

## ✅ Mock模式的作用

### 1. 跳过后端连接

- 不检查后端健康状态
- 不发送真实API请求
- 直接使用模拟数据

### 2. 生成智能模拟数据

Mock客户端会根据你的**实际代码变更**生成模拟数据：

- 根据文件名生成测试文件名
- 根据函数名生成测试用例名
- 根据变更行数确定影响级别

### 3. 完整测试前端流程

- ✅ 分析流程可以完整执行
- ✅ 树形视图可以正常显示
- ✅ 差异视图可以打开
- ✅ 决策对话框可以弹出
- ✅ 所有UI交互都可以测试

---

## 🔧 如何启用Mock模式

### 方法1：工作区配置（推荐）

在 `.vscode/settings.json` 中：

```json
{
  "llt-assistant.maintenance.useMockMode": true
}
```

### 方法2：用户设置

1. 按 `Ctrl+Shift+P`
2. 输入 `Preferences: Open User Settings (JSON)`
3. 添加：
   ```json
   {
     "llt-assistant.maintenance.useMockMode": true
   }
   ```

### 方法3：通过设置界面

1. 按 `Ctrl+,` 打开设置
2. 搜索 `llt-assistant.maintenance.useMockMode`
3. 勾选启用

---

## 🎯 验证Mock模式是否启用

### 在开发者工具中检查

1. 按 `Ctrl+Shift+I` 打开开发者工具
2. 在控制台输入：
   ```javascript
   vscode.workspace.getConfiguration('llt-assistant').get('maintenance.useMockMode')
   ```
3. 应该显示 `true`

### 通过行为判断

如果Mock模式启用：
- ✅ 不会显示 "Backend is not responding"
- ✅ 健康检查会立即通过（模拟）
- ✅ 会使用模拟数据进行分析
- ✅ 分析结果会显示在树形视图中

---

## 📝 Mock数据示例

### 输入（你的代码变更）

```python
# src/calculator.py
def add(a, b):
    return a + b  # 修改了这个函数
```

### 输出（Mock生成的模拟数据）

```json
{
  "test_file": "tests/test_calculator.py",
  "test_name": "test_add",
  "impact_level": "medium",
  "reason": "Function \"add\" was modified. 2 lines added, 1 lines removed."
}
```

---

## 🔄 完整测试流程（Mock模式）

1. **执行分析**
   - `Ctrl+Shift+P` → `LLT: Analyze Maintenance`
   - Mock模式：跳过健康检查 ✅
   - 分析Git变更 ✅
   - 生成模拟数据 ✅

2. **查看结果**
   - 树形视图显示模拟的受影响测试 ✅
   - 差异视图显示代码变更 ✅
   - 决策对话框弹出 ✅

3. **用户交互**
   - 选择功能是否变更 ✅
   - 输入功能描述 ✅
   - 选择要修复的测试 ✅

4. **批量修复**
   - 执行批量修复命令 ✅
   - 使用模拟数据 ✅
   - 显示模拟结果 ✅

---

## 💡 重要提示

### Mock模式 vs 真实后端

| 功能 | Mock模式 | 真实后端 |
|------|---------|---------|
| 健康检查 | ✅ 模拟通过 | ❌ 需要真实连接 |
| 分析请求 | ✅ 使用模拟数据 | ❌ 需要真实API |
| 批量修复 | ✅ 使用模拟数据 | ❌ 需要真实API |
| UI显示 | ✅ 完全正常 | ✅ 完全正常 |
| 数据准确性 | ⚠️ 模拟数据 | ✅ 真实数据 |

### 什么时候切换到真实后端？

当你准备好连接后端时：

1. **设置后端URL**：
   ```json
   {
     "llt-assistant.maintenance.backendUrl": "https://cs5351.efan.dev/api/v1"
   }
   ```

2. **关闭Mock模式**：
   ```json
   {
     "llt-assistant.maintenance.useMockMode": false
   }
   ```

3. **重新加载窗口**

---

## 🎯 总结

- ✅ **Mock模式已创建**：让你可以在没有后端的情况下测试前端
- ✅ **配置已设置**：`.vscode/settings.json` 中 `useMockMode: true`
- ✅ **功能完整**：所有前端UI功能都可以测试
- ⚠️ **如果还显示错误**：可能是配置没有生效，需要重新加载窗口

---

## 🚀 现在请执行

1. **确认配置**：检查 `.vscode/settings.json` 中是否有 `useMockMode: true`
2. **重新加载窗口**：`Ctrl+Shift+P` → `Developer: Reload Window`
3. **验证配置**：在开发者工具中检查配置值
4. **测试功能**：执行 `LLT: Analyze Maintenance`

如果重新加载后还是显示 "Backend is not responding"，请告诉我配置值是什么。


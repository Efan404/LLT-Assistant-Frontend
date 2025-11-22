# Mock模式故障排查

## ✅ 好消息

扩展已经成功激活，命令可以执行了！🎉

现在的问题是后端健康检查失败。这是因为 Mock 模式可能没有正确启用。

---

## 🔍 问题：Backend is not responding

### 可能原因

1. **配置没有正确读取**
   - 工作区配置可能没有生效
   - 需要重新加载窗口

2. **配置路径问题**
   - 配置可能读取的是用户配置而不是工作区配置

---

## ✅ 解决方案

### 方法1：重新加载窗口（最简单）

在扩展开发主机窗口中：

1. **按 `Ctrl+Shift+P`**
2. **输入 `Developer: Reload Window`**
3. **执行命令**
4. **等待窗口重新加载**
5. **再次测试命令**

### 方法2：验证配置

1. **按 `Ctrl+,` 打开设置**
2. **搜索 `llt-assistant.maintenance.useMockMode`**
3. **确认已勾选**
4. **如果没有，勾选它**

### 方法3：检查配置文件

确认 `.vscode/settings.json` 文件内容：

```json
{
  "llt-assistant.maintenance.useMockMode": true
}
```

### 方法4：在用户设置中配置

如果工作区配置不生效，可以在用户设置中配置：

1. **按 `Ctrl+Shift+P`**
2. **输入 `Preferences: Open User Settings (JSON)`**
3. **添加**：
   ```json
   {
     "llt-assistant.maintenance.useMockMode": true
   }
   ```

---

## 🎯 快速验证

### 检查配置是否生效

在扩展开发主机窗口中：

1. **打开开发者工具**（`Ctrl+Shift+I`）
2. **在控制台输入**：
   ```javascript
   vscode.workspace.getConfiguration('llt-assistant').get('maintenance.useMockMode')
   ```
3. **查看输出**：
   - 应该显示 `true`
   - 如果是 `false` 或 `undefined`，说明配置没有生效

---

## 🚀 推荐操作

1. **重新加载窗口**：`Ctrl+Shift+P` → `Developer: Reload Window`
2. **验证配置**：在开发者工具控制台检查配置值
3. **再次测试**：执行 `LLT: Analyze Maintenance`

如果重新加载后还是不行，请告诉我配置值是什么。


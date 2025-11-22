# 调试扩展激活问题

## 🔍 问题：命令未找到

如果看到 `command 'llt-assistant.analyzeMaintenance' not found`，说明扩展可能没有激活。

---

## ✅ 解决步骤

### 步骤1：检查扩展是否激活

在**扩展开发主机窗口**中：

1. **打开输出面板**
   - 按 `Ctrl+Shift+U`
   - 或点击 `查看` → `输出`

2. **选择输出源**
   - 下拉菜单选择 "Extension Host"
   - 或 "LLT Assistant"

3. **查找激活日志**
   - 应该看到：`LLT Assistant extension is now active`
   - 如果没有，说明扩展没有激活

### 步骤2：强制激活扩展

如果扩展没有激活，可以：

1. **打开一个Python文件**
   - 在扩展开发主机窗口中
   - 打开任意 `.py` 文件
   - 这会触发 `onLanguage:python` 激活事件

2. **或者打开维护视图**
   - 点击左侧 Activity Bar 的 "LLT Maintenance" 图标
   - 这会触发 `onView:lltMaintenanceExplorer` 激活事件

3. **或者执行命令**
   - 按 `Ctrl+Shift+P`
   - 输入 `Developer: Reload Window`
   - 重新加载窗口

### 步骤3：验证命令是否注册

在扩展开发主机窗口中：

1. **打开开发者工具**
   - 按 `Ctrl+Shift+I`
   - 或 `帮助` → `切换开发人员工具`

2. **在控制台输入**：
   ```javascript
   vscode.commands.getCommands().then(commands => {
     const lltCommands = commands.filter(c => c.includes('llt-assistant'));
     console.log('LLT Commands:', lltCommands);
     console.log('Has analyzeMaintenance:', lltCommands.includes('llt-assistant.analyzeMaintenance'));
   });
   ```

3. **查看输出**：
   - 应该看到 `llt-assistant.analyzeMaintenance` 在列表中
   - 如果不在，说明命令未注册

---

## 🛠️ 完整排查流程

### 1. 确认编译成功

```bash
npm run compile
```

确保：
- ✅ 没有TypeScript错误
- ✅ 没有ESLint错误
- ✅ `dist/extension.js` 文件已更新

### 2. 完全重启扩展开发主机

1. **关闭扩展开发主机窗口**
2. **在主窗口停止调试**（如果还在运行）
   - 按 `Shift+F5`
3. **重新启动**
   - 按 `F5`

### 3. 检查激活事件

确保满足以下任一条件：
- 打开Python文件（`.py`）
- 打开维护视图（点击Activity Bar图标）
- 打开测试文件（`test_*.py`）

### 4. 查看输出日志

在输出面板中查找：
- ✅ `LLT Assistant extension is now active` - 扩展已激活
- ❌ 红色错误信息 - 扩展激活失败
- ❌ `Cannot find module` - 导入错误

---

## 🎯 快速修复方法

### 方法1：打开Python文件触发激活

1. 在扩展开发主机窗口中
2. 创建或打开一个 `.py` 文件
3. 等待扩展激活
4. 再次尝试执行命令

### 方法2：重新加载窗口

1. 在扩展开发主机窗口中
2. 按 `Ctrl+Shift+P`
3. 输入 `Developer: Reload Window`
4. 等待窗口重新加载
5. 再次尝试执行命令

### 方法3：添加更宽松的激活事件

如果以上方法都不行，可以临时修改 `package.json`：

```json
{
  "activationEvents": [
    "*"  // 这会立即激活扩展（仅用于测试）
  ]
}
```

**注意**：测试完后记得改回来！

---

## 📝 检查清单

- [ ] 已重新编译扩展（`npm run compile`）
- [ ] 已完全重启扩展开发主机（关闭窗口，重新按F5）
- [ ] 输出面板显示 "LLT Assistant extension is now active"
- [ ] 已打开Python文件或维护视图（触发激活）
- [ ] 开发者工具控制台显示命令已注册
- [ ] 没有错误信息

---

## 💡 常见原因

1. **扩展未激活**
   - 激活事件不满足
   - 打开Python文件或维护视图

2. **代码未重新编译**
   - 执行 `npm run compile`
   - 确保 `dist/extension.js` 已更新

3. **扩展开发主机未重新加载**
   - 关闭窗口，重新按F5

4. **导入错误**
   - 检查输出面板的错误信息
   - 确保所有依赖都正确导入

---

## 🚀 现在请执行

1. **检查输出面板**
   - 查看是否有 "LLT Assistant extension is now active"

2. **如果没有，触发激活**
   - 打开一个Python文件
   - 或点击维护视图图标

3. **再次测试命令**
   - `Ctrl+Shift+P` → `LLT: Analyze Maintenance`

如果还是不行，请告诉我输出面板中的具体错误信息。


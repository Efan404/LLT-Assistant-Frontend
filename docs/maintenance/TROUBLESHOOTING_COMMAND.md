# 命令未找到问题排查

## 🔍 问题：command 'llt-assistant.analyzeMaintenance' not found

### 可能原因

1. 扩展没有重新编译
2. 扩展开发主机没有重新加载
3. 没有打开工作区（文件夹）
4. 代码有错误导致注册失败

---

## ✅ 解决步骤（按顺序执行）

### 步骤1：确认工作区已打开

**重要**：命令注册在 `if (workspaceRoot)` 条件内，必须打开文件夹作为工作区。

1. **检查是否打开了文件夹**
   - 查看VSCode顶部标题栏
   - 应该显示文件夹名称，而不是单个文件名

2. **如果没有打开文件夹**：
   - 点击 `文件` → `打开文件夹`
   - 选择项目根目录：`C:\Users\Lenovo\LLT-Assistant-Frontend`
   - 点击"选择文件夹"

### 步骤2：重新编译扩展

在终端中执行：

```bash
npm run compile
```

**确认编译成功**：
- 终端显示 "Compiled successfully" 或类似消息
- 没有TypeScript错误
- `dist/extension.js` 文件已更新

### 步骤3：完全重启扩展开发主机

1. **关闭扩展开发主机窗口**
   - 关闭新打开的窗口（不是主VSCode窗口）

2. **回到主VSCode窗口**

3. **停止调试**（如果还在运行）
   - 按 `Shift+F5` 停止调试
   - 或点击调试工具栏的停止按钮

4. **重新启动**
   - 按 `F5` 重新启动扩展开发主机

### 步骤4：验证命令是否注册

在新打开的扩展开发主机窗口中：

1. **打开命令面板**
   - 按 `Ctrl+Shift+P`

2. **搜索命令**
   - 输入 `LLT: Analyze Maintenance`
   - 查看命令是否出现在列表中

3. **如果命令出现**：
   - 说明注册成功，可以执行

4. **如果命令不出现**：
   - 继续下面的排查步骤

---

## 🔧 深度排查

### 检查1：查看输出日志

1. **在主VSCode窗口**（不是扩展开发主机）
2. **打开输出面板**
   - 按 `Ctrl+Shift+U`
3. **选择输出源**
   - 下拉菜单选择 "Extension Host"
   - 或 "LLT Assistant"
4. **查看错误信息**
   - 查找红色错误信息
   - 查找 "activate" 相关日志

### 检查2：验证扩展是否激活

在扩展开发主机窗口中：

1. **打开输出面板**（`Ctrl+Shift+U`）
2. **选择 "Extension Host"**
3. **查找日志**：
   ```
   LLT Assistant extension is now active
   ```
   - 如果看到这条日志，说明扩展已激活
   - 如果没有，说明扩展激活失败

### 检查3：检查代码是否有运行时错误

1. **查看输出面板的错误**
2. **常见错误**：
   - `Cannot find module` - 导入错误
   - `TypeError` - 类型错误
   - `ReferenceError` - 引用错误

---

## 🛠️ 快速修复方法

### 方法1：完全重启

1. **关闭所有VSCode窗口**
2. **重新打开VSCode**
3. **打开项目文件夹**
4. **重新编译**：`npm run compile`
5. **按F5启动**

### 方法2：清理并重新编译

```bash
# 删除编译输出
rmdir /s /q dist

# 重新编译
npm run compile
```

### 方法3：检查激活事件

确保 `package.json` 中有正确的激活事件：

```json
{
  "activationEvents": [
    "onLanguage:python",
    "onView:lltMaintenanceExplorer",
    "workspaceContains:**/test_*.py"
  ]
}
```

---

## 🎯 验证命令注册

### 测试方法

在扩展开发主机窗口中，打开开发者工具：

1. **打开开发者工具**
   - 按 `Ctrl+Shift+I`
   - 或 `帮助` → `切换开发人员工具`

2. **在控制台输入**：
   ```javascript
   vscode.commands.getCommands().then(commands => {
     console.log(commands.filter(c => c.includes('llt-assistant')));
   });
   ```

3. **查看输出**：
   - 应该看到 `llt-assistant.analyzeMaintenance` 等命令
   - 如果没有，说明命令未注册

---

## 💡 常见问题

### Q1: 为什么命令注册在条件内？

A: 因为需要工作区路径来初始化Git相关组件。如果没有工作区，这些组件无法工作。

**解决方案**：确保打开文件夹作为工作区。

### Q2: 编译成功但命令还是不出现？

A: 可能是扩展没有激活。检查：
- 激活事件是否满足
- 是否有运行时错误
- 输出面板的错误信息

### Q3: 如何强制激活扩展？

A: 在命令面板执行：
- `Developer: Reload Window` - 重新加载窗口
- 或添加激活事件：`onStartupFinished`

---

## ✅ 完整检查清单

- [ ] 已打开文件夹作为工作区（不是单个文件）
- [ ] 已执行 `npm run compile` 且成功
- [ ] `dist/extension.js` 文件存在且最近更新
- [ ] 已关闭并重新打开扩展开发主机窗口
- [ ] 输出面板没有错误信息
- [ ] 扩展已激活（看到激活日志）

---

## 🚀 推荐操作流程

1. **确保工作区已打开**
   ```
   文件 → 打开文件夹 → 选择项目根目录
   ```

2. **重新编译**
   ```bash
   npm run compile
   ```

3. **完全重启**
   - 关闭扩展开发主机窗口
   - 按 `F5` 重新启动

4. **验证**
   - 在新窗口中按 `Ctrl+Shift+P`
   - 输入 `LLT: Analyze Maintenance`
   - 查看命令是否出现

如果按照以上步骤操作后仍然有问题，请查看输出面板的错误信息并告诉我。


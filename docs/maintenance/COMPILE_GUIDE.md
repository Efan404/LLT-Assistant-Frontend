# 编译扩展详细指南

## 📍 在哪里编译？

**在VSCode的集成终端中执行编译命令**

---

## 🖥️ 打开终端的方法

### 方法1：快捷键（最快）

- **Windows/Linux**: `` Ctrl+` `` (反引号，在数字1左边，Tab键上方)
- **Mac**: `` Cmd+` ``

### 方法2：菜单

- 点击顶部菜单：`终端` → `新建终端`

### 方法3：命令面板

- 按 `Ctrl+Shift+P` (Windows) 或 `Cmd+Shift+P` (Mac)
- 输入 `Terminal: Create New Terminal`
- 回车

---

## 📂 确认工作目录

打开终端后，确认当前目录是项目根目录：

```
C:\Users\Lenovo\LLT-Assistant-Frontend>
```

如果不是，执行：

```bash
cd C:\Users\Lenovo\LLT-Assistant-Frontend
```

---

## 🔧 编译步骤

### 步骤1：安装依赖（首次或更新后）

```bash
pnpm install
```

**如果提示找不到pnpm**，先安装：

```bash
npm install -g pnpm
```

**或者使用npm**：

```bash
npm install
```

### 步骤2：编译扩展

```bash
pnpm run compile
```

**或者使用npm**：

```bash
npm run compile
```

### 步骤3：查看编译结果

编译成功后，终端会显示类似信息：

```
✓ Compiled successfully
```

编译后的文件位于：`dist/extension.js`

---

## ✅ 验证编译成功

### 方法1：检查文件

在VSCode文件资源管理器中：
- 展开 `dist` 文件夹
- 确认 `extension.js` 文件存在且最近更新

### 方法2：查看终端输出

编译成功会显示：
- ✅ 没有错误信息
- ✅ 显示 "Compiled successfully" 或类似成功消息

### 方法3：查看文件大小

- `dist/extension.js` 文件应该有内容（不是0字节）
- 通常大小在几百KB到几MB之间

---

## 🐛 常见问题解决

### 问题1：`pnpm: command not found`

**原因**：系统没有安装pnpm

**解决方案**：

```bash
# 使用npm安装pnpm
npm install -g pnpm

# 或者直接使用npm
npm install
npm run compile
```

### 问题2：`找不到模块` 或 `Cannot find module`

**原因**：依赖没有安装

**解决方案**：

```bash
# 先安装依赖
pnpm install

# 然后再编译
pnpm run compile
```

### 问题3：TypeScript编译错误

**原因**：代码有语法错误或类型错误

**解决方案**：

1. 查看终端中的错误信息
2. 找到错误所在的文件和行号
3. 修复错误
4. 保存文件
5. 重新编译

**示例错误**：
```
src/maintenance/api/maintenanceClient.ts:25:5 - error TS2304: Cannot find name 'axios'
```

**解决方法**：检查是否正确导入模块

### 问题4：编译很慢

**原因**：首次编译或文件较多

**解决方案**：
- 这是正常的，首次编译需要编译所有文件
- 后续修改后编译会更快（增量编译）

### 问题5：编译后扩展不工作

**原因**：可能需要重启扩展开发主机

**解决方案**：
1. 停止当前的扩展开发主机（关闭新打开的窗口）
2. 重新按 `F5` 启动
3. 扩展会使用最新编译的代码

---

## 🔄 开发工作流

### 推荐工作流：

1. **修改代码**
   - 编辑 `.ts` 文件
   - 保存文件（`Ctrl+S`）

2. **编译代码**
   ```bash
   pnpm run compile
   ```

3. **测试扩展**
   - 按 `F5` 启动扩展开发主机
   - 在新窗口中测试功能

4. **查看日志**
   - 如果出错，按 `Ctrl+Shift+U` 打开输出面板
   - 选择 "LLT Assistant" 查看日志

### 自动编译（可选）

如果安装了 `watch` 模式，可以自动编译：

```bash
pnpm run watch
```

这样修改代码后会自动重新编译。

---

## 📝 编译命令说明

### 可用的编译命令

查看 `package.json` 中的 `scripts` 部分：

```json
{
  "scripts": {
    "compile": "pnpm run check-types && pnpm run lint && node esbuild.js",
    "watch": "npm-run-all -p watch:*",
    "package": "pnpm run check-types && pnpm run lint && node esbuild.js --production"
  }
}
```

**命令说明**：

- `pnpm run compile` - 完整编译（类型检查 + 代码检查 + 构建）
- `pnpm run watch` - 监听模式（自动重新编译）
- `pnpm run package` - 生产环境打包

---

## 🎯 快速检查清单

编译前确认：

- [ ] 终端已打开
- [ ] 当前目录是项目根目录
- [ ] 已安装依赖（`pnpm install`）
- [ ] 所有代码文件已保存

编译后确认：

- [ ] 终端显示编译成功
- [ ] `dist/extension.js` 文件存在
- [ ] 没有错误信息
- [ ] 文件大小正常（不是0字节）

---

## 💡 提示

1. **首次编译**：可能需要几分钟，这是正常的
2. **后续编译**：通常只需要几秒钟
3. **修改代码后**：记得重新编译才能生效
4. **使用F5测试**：每次按F5都会使用最新编译的代码

---

## 🚀 下一步

编译成功后：

1. 按 `F5` 启动扩展开发主机
2. 在新窗口中测试功能
3. 执行 `LLT: Analyze Maintenance` 测试连接

祝你编译顺利！🎉


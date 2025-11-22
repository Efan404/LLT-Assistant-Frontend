# 故障排查指南

## 🔧 常见问题解决

### 问题1：pnpm命令未找到

**错误信息**：
```
pnpm : 无法将"pnpm"项识别为 cmdlet、函数、脚本文件或可运行程序的名称
```

**原因**：系统没有安装pnpm

**解决方案（3选1）**：

#### 方案A：使用npm（最简单，推荐）

直接使用npm代替pnpm：

```bash
# 安装依赖
npm install

# 编译扩展
npm run compile
```

**优点**：
- ✅ npm通常已经随Node.js安装
- ✅ 无需额外安装
- ✅ 功能完全一样

#### 方案B：安装pnpm

如果你想使用pnpm：

```bash
# 使用npm安装pnpm
npm install -g pnpm

# 验证安装
pnpm --version

# 然后使用pnpm
pnpm install
pnpm run compile
```

#### 方案C：使用yarn（如果已安装）

```bash
yarn install
yarn compile
```

---

### 问题2：npm命令也未找到

**错误信息**：
```
npm : 无法将"npm"项识别为 cmdlet、函数、脚本文件或可运行程序的名称
```

**原因**：没有安装Node.js，或者Node.js没有添加到PATH环境变量

**解决方案**：

#### 方案A：安装Node.js（推荐）

1. **下载Node.js**
   - 访问：https://nodejs.org/
   - 下载 **LTS版本**（长期支持版本）
   - 点击绿色的"LTS"按钮下载

2. **安装Node.js**
   - 运行下载的 `.msi` 安装程序
   - **重要**：在安装过程中，确保勾选：
     - ✅ **Add to PATH**（添加到PATH环境变量）
     - ✅ **npm package manager**（npm包管理器）
   - 完成安装

3. **重启VSCode**
   - 完全关闭VSCode
   - 重新打开VSCode
   - 打开新终端

4. **验证安装**
   ```bash
   node --version
   npm --version
   ```
   应该显示版本号，例如：
   ```
   v20.11.0
   10.2.4
   ```

5. **如果还是不行**
   - 重启电脑（让环境变量生效）
   - 或查看详细安装指南：[安装Node.js指南](./INSTALL_NODEJS.md)

#### 方案B：手动添加到PATH（如果已安装）

如果Node.js已安装但找不到：

1. 找到Node.js安装路径（通常是 `C:\Program Files\nodejs\`）
2. 添加到系统PATH环境变量
3. 重启VSCode

详细步骤见：[安装Node.js指南](./INSTALL_NODEJS.md)

---

### 问题3：编译时出现TypeScript错误

**错误信息示例**：
```
error TS2304: Cannot find name 'vscode'
error TS2307: Cannot find module 'axios'
```

**原因**：依赖未正确安装或类型定义缺失

**解决方案**：

1. **重新安装依赖**
   ```bash
   npm install
   ```

2. **检查node_modules是否存在**
   - 查看项目根目录是否有 `node_modules` 文件夹
   - 如果没有，说明依赖安装失败

3. **清理后重新安装**
   ```bash
   # 删除node_modules和锁文件
   rm -r node_modules
   rm package-lock.json
   
   # 重新安装
   npm install
   ```

4. **如果还有问题，检查package.json**
   - 确认所有依赖都列在 `dependencies` 或 `devDependencies` 中

---

### 问题4：编译成功但扩展不工作

**症状**：编译没有错误，但按F5后扩展功能不工作

**解决方案**：

1. **确认使用了最新编译的代码**
   - 停止当前的扩展开发主机（关闭新窗口）
   - 重新按 `F5` 启动

2. **检查dist/extension.js**
   - 确认文件存在且最近更新
   - 文件大小应该不是0字节

3. **查看输出日志**
   - 按 `Ctrl+Shift+U` 打开输出面板
   - 选择 "LLT Assistant"
   - 查看是否有错误信息

4. **检查扩展是否激活**
   - 在新窗口中，按 `Ctrl+Shift+P`
   - 输入 `Developer: Reload Window`
   - 重新加载窗口

---

### 问题5：网络问题导致安装失败

**错误信息**：
```
npm ERR! network timeout
npm ERR! code ECONNREFUSED
```

**解决方案**：

1. **检查网络连接**
   - 确认能访问互联网
   - 尝试访问 https://www.npmjs.com

2. **使用国内镜像（如果在中国）**
   ```bash
   # 设置npm镜像
   npm config set registry https://registry.npmmirror.com
   
   # 然后重新安装
   npm install
   ```

3. **清除npm缓存**
   ```bash
   npm cache clean --force
   npm install
   ```

---

### 问题6：权限问题

**错误信息**：
```
npm ERR! EACCES: permission denied
```

**解决方案**：

1. **Windows：以管理员身份运行**
   - 右键点击VSCode
   - 选择"以管理员身份运行"
   - 重新打开终端

2. **或者修改npm全局目录**
   ```bash
   npm config set prefix %APPDATA%\npm
   ```

---

### 问题7：端口被占用

**错误信息**：
```
Error: listen EADDRINUSE: address already in use
```

**解决方案**：

1. **关闭占用端口的进程**
   - Windows: 打开任务管理器，结束相关Node.js进程
   - 或重启VSCode

2. **使用不同的端口**
   - 在launch.json中修改端口配置

---

## 🔍 调试技巧

### 查看详细错误信息

1. **打开输出面板**
   - 按 `Ctrl+Shift+U`
   - 选择 "LLT Assistant" 或 "TypeScript"

2. **查看终端完整输出**
   - 不要只看最后几行
   - 向上滚动查看完整错误信息

3. **检查文件路径**
   - 确认所有文件路径正确
   - 注意Windows路径使用反斜杠 `\`

### 验证环境

运行以下命令检查环境：

```bash
# 检查Node.js版本
node --version

# 检查npm版本
npm --version

# 检查当前目录
pwd  # Linux/Mac
cd   # Windows PowerShell

# 检查文件是否存在
ls package.json  # Linux/Mac
dir package.json # Windows
```

---

## 📞 获取帮助

如果以上方法都无法解决问题：

1. **查看完整错误日志**
   - 复制完整的错误信息
   - 包括错误前后的上下文

2. **检查项目要求**
   - 查看 `README.md`
   - 确认Node.js版本要求

3. **搜索错误信息**
   - 在Google或Stack Overflow搜索错误信息
   - 通常能找到解决方案

---

## ✅ 快速检查清单

遇到问题时，按顺序检查：

- [ ] Node.js已安装（`node --version`）
- [ ] npm可用（`npm --version`）
- [ ] 当前目录正确（项目根目录）
- [ ] 依赖已安装（`node_modules` 存在）
- [ ] 所有文件已保存
- [ ] 没有语法错误
- [ ] 网络连接正常
- [ ] 权限足够

---

## 💡 预防措施

1. **使用版本管理**
   - 使用 `.nvmrc` 指定Node.js版本
   - 团队使用相同版本

2. **定期更新依赖**
   ```bash
   npm update
   ```

3. **使用锁文件**
   - 提交 `package-lock.json` 到Git
   - 确保团队使用相同依赖版本

4. **清理缓存**
   ```bash
   npm cache clean --force
   ```

---

祝你顺利解决问题！🚀


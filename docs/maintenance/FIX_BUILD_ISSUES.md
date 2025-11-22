# 解决编译问题指南

## 🔧 问题1：缺少 Visual Studio Build Tools

### 错误信息
```
gyp ERR! find VS You need to install the latest version of Visual Studio
gyp ERR! find VS including the "Desktop development with C++" workload.
```

### 原因
`tree-sitter` 是一个原生模块，需要 C++ 编译器来编译。在 Windows 上需要 Visual Studio Build Tools。

### 解决方案（3选1）

#### 方案A：安装 Visual Studio Build Tools（推荐，一次性解决）

1. **下载 Build Tools**
   - 访问：https://visualstudio.microsoft.com/downloads/
   - 滚动到底部，找到 "Tools for Visual Studio"
   - 下载 "Build Tools for Visual Studio 2022"

2. **安装 Build Tools**
   - 运行安装程序
   - 选择 "C++ build tools" 工作负载
   - 确保勾选：
     - ✅ **Desktop development with C++**
     - ✅ **Windows 10/11 SDK**
   - 点击"安装"

3. **重新安装依赖**
   ```bash
   npm install
   ```

**优点**：一次性解决，以后编译其他原生模块也没问题

#### 方案B：安装 Visual Studio Community（完整版）

如果你需要完整的 IDE：

1. 下载 Visual Studio Community（免费）
2. 安装时选择 "Desktop development with C++" 工作负载
3. 重新运行 `npm install`

#### 方案C：跳过 tree-sitter（临时方案）

如果暂时不需要 tree-sitter 功能，可以跳过：

1. **删除 node_modules**
   ```bash
   rmdir /s node_modules
   ```

2. **修改 package.json**（临时移除 tree-sitter）
   - 注释掉 `tree-sitter` 和 `tree-sitter-python` 依赖
   - 或者使用 `npm install --ignore-scripts`（不推荐，可能影响功能）

3. **重新安装**
   ```bash
   npm install --ignore-scripts
   ```

**注意**：这可能会影响某些功能，不推荐长期使用。

---

## 🔧 问题2：脚本使用 pnpm 但系统没有安装

### 错误信息
```
'pnpm' 不是内部或外部命令，也不是可运行的程序
```

### 解决方案

我已经修改了 `package.json`，将所有 `pnpm run` 改为 `npm run`。

**现在可以直接使用：**

```bash
npm run compile
```

---

## 🚀 完整解决步骤

### 步骤1：安装 Visual Studio Build Tools

1. 访问：https://visualstudio.microsoft.com/downloads/
2. 下载 "Build Tools for Visual Studio 2022"
3. 安装时选择 "Desktop development with C++"
4. 等待安装完成（可能需要10-30分钟）

### 步骤2：清理并重新安装

```bash
# 删除旧的 node_modules（如果有问题）
rmdir /s /q node_modules

# 删除锁文件
del package-lock.json

# 重新安装
npm install
```

### 步骤3：编译扩展

```bash
npm run compile
```

---

## ⚡ 快速解决方案（如果急需使用）

如果你想快速测试功能，可以先跳过 tree-sitter：

```bash
# 1. 删除 node_modules
rmdir /s /q node_modules

# 2. 安装时忽略脚本（跳过原生模块编译）
npm install --ignore-scripts

# 3. 直接编译（不依赖 tree-sitter）
npm run compile
```

**注意**：这可能会影响某些代码分析功能，但基本功能应该可以工作。

---

## 🔍 验证安装

安装 Build Tools 后，验证：

```bash
# 检查 node-gyp 是否能找到 Visual Studio
npm config get msvs_version

# 或者
npm install -g node-gyp
node-gyp --version
```

---

## 💡 推荐方案

**最佳实践**：
1. ✅ 安装 Visual Studio Build Tools（一次性解决）
2. ✅ 使用修改后的 package.json（已改为 npm）
3. ✅ 正常安装和编译

**时间**：Build Tools 安装需要 10-30 分钟，但之后就不会再有这个问题了。

---

## ❓ 常见问题

### Q: Build Tools 安装很慢怎么办？

A: 这是正常的，因为需要下载很多组件。可以：
- 选择最小安装（只安装必要的）
- 使用稳定的网络连接
- 在空闲时间安装

### Q: 安装 Build Tools 后还是失败？

A: 
1. 重启电脑
2. 重新打开终端
3. 清理后重试：
   ```bash
   rmdir /s /q node_modules
   npm install
   ```

### Q: 不想安装 Build Tools 怎么办？

A: 可以尝试使用预编译的二进制文件，或者使用 Docker/WSL2 环境。

---

## 🎯 下一步

安装 Build Tools 后：

1. **重新安装依赖**
   ```bash
   npm install
   ```

2. **编译扩展**
   ```bash
   npm run compile
   ```

3. **测试功能**
   - 按 `F5` 启动扩展开发主机
   - 测试维护功能

祝你顺利解决问题！🚀


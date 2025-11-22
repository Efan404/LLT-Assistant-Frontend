# 安装Node.js指南

## 🔍 问题诊断

如果你看到以下错误：
```
npm : 无法将"npm"项识别为 cmdlet、函数、脚本文件或可运行程序的名称
```

**原因**：系统没有安装Node.js，或者Node.js没有添加到系统PATH环境变量中。

---

## ✅ 解决方案：安装Node.js

### 方法一：官方安装（推荐）

#### 步骤1：下载Node.js

1. **访问Node.js官网**
   - 打开浏览器，访问：https://nodejs.org/
   - 或直接访问中文站：https://nodejs.org/zh-cn/

2. **选择版本**
   - 推荐下载 **LTS版本**（长期支持版本，更稳定）
   - 点击绿色的 "LTS" 按钮下载

3. **下载安装包**
   - Windows会自动下载 `.msi` 安装包
   - 文件名类似：`node-v20.x.x-x64.msi`

#### 步骤2：安装Node.js

1. **运行安装程序**
   - 双击下载的 `.msi` 文件
   - 如果提示安全警告，点击"运行"

2. **安装向导**
   - 点击 "Next" 继续
   - 接受许可协议
   - **重要**：在"Custom Setup"页面，确保勾选：
     - ✅ **Add to PATH**（添加到PATH环境变量）
     - ✅ **npm package manager**（npm包管理器）
   - 点击 "Next" 继续
   - 点击 "Install" 开始安装
   - 等待安装完成

3. **完成安装**
   - 点击 "Finish" 完成安装

#### 步骤3：验证安装

1. **关闭当前终端**
   - 关闭VSCode的终端窗口
   - 或者关闭整个VSCode

2. **重新打开终端**
   - 重新打开VSCode
   - 按 `` Ctrl+` `` 打开新终端

3. **验证Node.js和npm**
   ```bash
   node --version
   npm --version
   ```

   应该看到类似输出：
   ```
   v20.11.0
   10.2.4
   ```

4. **如果还是不行**
   - 可能需要重启电脑（让环境变量生效）
   - 或者手动添加到PATH（见下方）

---

### 方法二：使用包管理器安装（高级用户）

#### 使用Chocolatey（Windows）

如果你安装了Chocolatey：

```powershell
choco install nodejs-lts
```

#### 使用Scoop（Windows）

如果你安装了Scoop：

```powershell
scoop install nodejs-lts
```

#### 使用Winget（Windows 10/11）

```powershell
winget install OpenJS.NodeJS.LTS
```

---

### 方法三：手动添加到PATH（如果已安装但找不到）

如果Node.js已安装但命令找不到，需要手动添加到PATH：

#### 步骤1：找到Node.js安装路径

通常安装在：
- `C:\Program Files\nodejs\`
- `C:\Program Files (x86)\nodejs\`
- 或自定义路径

#### 步骤2：添加到PATH

1. **打开系统属性**
   - 按 `Win + R`
   - 输入 `sysdm.cpl`，回车
   - 或：右键"此电脑" → "属性" → "高级系统设置"

2. **编辑环境变量**
   - 点击"环境变量"按钮
   - 在"系统变量"中找到 `Path`
   - 点击"编辑"

3. **添加路径**
   - 点击"新建"
   - 输入Node.js安装路径，例如：`C:\Program Files\nodejs`
   - 点击"确定"保存

4. **重启终端**
   - 关闭所有终端和VSCode
   - 重新打开VSCode
   - 再次尝试 `node --version`

---

## 🧪 测试安装

安装完成后，在终端执行：

```bash
# 检查Node.js版本
node --version

# 检查npm版本
npm --version

# 检查安装路径
where node    # Windows
which node    # Linux/Mac
```

如果都能正常显示版本号，说明安装成功！

---

## 📦 安装完成后继续

Node.js安装成功后，回到项目目录执行：

```bash
# 1. 安装项目依赖
npm install

# 2. 编译扩展
npm run compile
```

---

## ❓ 常见问题

### Q1: 安装后还是找不到命令

**解决方案**：
1. 完全关闭VSCode
2. 重新打开VSCode
3. 打开新终端再试

如果还不行，重启电脑。

### Q2: 安装时没有勾选"Add to PATH"

**解决方案**：
- 重新运行安装程序
- 选择"Change"（修改）
- 勾选"Add to PATH"
- 完成修改

### Q3: 不知道Node.js安装在哪里

**解决方案**：
1. 打开文件资源管理器
2. 在地址栏输入：`C:\Program Files\nodejs`
3. 如果存在，说明安装在这里
4. 如果不存在，搜索 `node.exe`

### Q4: 安装失败或出错

**解决方案**：
1. 以管理员身份运行安装程序
2. 关闭杀毒软件后重试
3. 检查磁盘空间是否足够
4. 查看安装日志了解具体错误

---

## 🎯 快速检查清单

安装Node.js前：
- [ ] 确认系统是Windows 10/11
- [ ] 确认有管理员权限
- [ ] 确认有足够的磁盘空间（至少100MB）

安装Node.js后：
- [ ] 关闭并重新打开VSCode
- [ ] 打开新终端
- [ ] 执行 `node --version` 有输出
- [ ] 执行 `npm --version` 有输出

---

## 💡 推荐版本

- **Node.js LTS版本**：v20.x.x 或 v18.x.x（推荐）
- **npm版本**：随Node.js自动安装（通常是最新稳定版）

---

## 🚀 下一步

Node.js安装成功后：

1. **回到项目目录**
   ```bash
   cd C:\Users\Lenovo\LLT-Assistant-Frontend
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **编译扩展**
   ```bash
   npm run compile
   ```

祝你安装顺利！🎉


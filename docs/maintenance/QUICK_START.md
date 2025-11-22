# 快速开始 - 对接你的后端接口

## 步骤1：配置后端URL

### 方法一：VSCode设置（最简单）

1. 按 `Ctrl+,` (Windows) 或 `Cmd+,` (Mac) 打开设置
2. 在搜索框输入：`llt-assistant.maintenance.backendUrl`
3. 将值设置为：`https://cs5351.efan.dev/api/v1`
4. 保存

### 方法二：编辑配置文件

创建或编辑 `.vscode/settings.json`：

```json
{
  "llt-assistant.maintenance.backendUrl": "https://cs5351.efan.dev/api/v1"
}
```

---

## 步骤2：编译扩展

### 在哪里操作？

**在VSCode的集成终端中执行命令**

### 详细步骤：

#### 方法一：使用npm（推荐，无需额外安装）

如果你看到 `pnpm: 无法识别` 错误，可以直接使用npm：

1. **打开终端**
   - 按 `` Ctrl+` `` (反引号，在数字1左边) 打开终端
   - 或点击菜单：`终端` → `新建终端`

2. **确认当前目录**
   - 终端应该显示项目根目录：`C:\Users\Lenovo\LLT-Assistant-Frontend>`
   - 如果不是，执行：`cd C:\Users\Lenovo\LLT-Assistant-Frontend`

3. **安装依赖**
   ```bash
   npm install
   ```

4. **编译扩展**
   ```bash
   npm run compile
   ```

5. **查看编译结果**
   - 如果成功，会看到类似输出：
     ```
     ✓ Compiled successfully
     ```
   - 编译后的文件在 `dist/extension.js`

#### 方法二：安装pnpm后使用（可选）

如果你想使用pnpm：

1. **先安装pnpm**
   ```bash
   npm install -g pnpm
   ```

2. **然后使用pnpm**
   ```bash
   pnpm install
   pnpm run compile
   ```

#### 方法三：使用系统命令行（PowerShell/CMD）

1. **打开PowerShell或CMD**
   - 按 `Win+R`，输入 `powershell` 或 `cmd`，回车

2. **切换到项目目录**
   ```powershell
   cd C:\Users\Lenovo\LLT-Assistant-Frontend
   ```

3. **执行编译命令（使用npm）**
   ```powershell
   npm install
   npm run compile
   ```

### 编译成功标志

编译成功后，你应该看到：
- ✅ 终端显示编译成功信息
- ✅ `dist/extension.js` 文件已生成或更新
- ✅ 没有错误信息

### 常见问题

**Q: 提示 `pnpm: command not found`**
- 需要先安装pnpm：`npm install -g pnpm`
- 或者使用npm：`npm install` 和 `npm run compile`

**Q: 提示 `找不到模块` 或 `Cannot find module`**
- 先执行 `pnpm install` 安装依赖

**Q: 编译失败，有TypeScript错误**
- 检查代码是否有语法错误
- 查看终端中的错误信息
- 确保所有新文件都已保存

**Q: 如何查看编译输出？**
- 编译后的文件在 `dist/extension.js`
- 可以在VSCode中查看这个文件确认已生成

---

## 步骤3：测试后端连接

### 方式一：通过命令测试

1. 按 `F5` 启动扩展开发主机
2. 在新窗口中，按 `Ctrl+Shift+P`
3. 输入 `LLT: Analyze Maintenance`
4. 查看是否提示 "Backend is not responding"

### 方式二：手动测试API

在浏览器或使用curl测试：

```bash
# 测试健康检查
curl https://cs5351.efan.dev/api/v1/health

# 应该返回类似：
# {"status": "ok"} 或 {"status": "healthy"}
```

---

## 步骤4：使用功能

### 前提条件

1. 确保你的项目是Git仓库
2. 至少有2个提交（用于对比）
3. 有Python源代码文件

### 使用步骤

1. **打开维护视图**
   - 点击左侧Activity Bar的 "LLT Maintenance" 图标

2. **执行分析**
   - 点击视图顶部的 "Analyze Maintenance" 按钮
   - 或使用命令：`LLT: Analyze Maintenance`

3. **查看结果**
   - 等待分析完成
   - 查看树形视图中的结果

---

## 后端接口要求

你的后端需要实现以下接口：

### 1. GET /health

**响应示例**：
```json
{
  "status": "ok"
}
```

### 2. POST /maintenance/analyze

**请求体**：
```json
{
  "commit_hash": "abc123...",
  "previous_commit_hash": "def456...",
  "changes": [
    {
      "file_path": "src/example.py",
      "old_content": "def add(a, b):\n    return a + b",
      "new_content": "def add(a, b):\n    if a < 0 or b < 0:\n        raise ValueError('Negative numbers not supported')\n    return a + b",
      "changed_functions": ["add"],
      "lines_added": 2,
      "lines_removed": 1
    }
  ]
}
```

**响应示例**：
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

### 3. POST /maintenance/batch-fix

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

**响应示例**：
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

---

## 验证功能

### 测试场景

1. **创建测试项目**
   ```bash
   mkdir test-maintenance
   cd test-maintenance
   git init
   ```

2. **创建源代码**
   ```python
   # src/calculator.py
   def add(a, b):
       return a + b
   ```

3. **创建测试文件**
   ```python
   # tests/test_calculator.py
   def test_add():
       assert add(1, 2) == 3
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "Initial commit"
   ```

5. **修改代码**
   ```python
   # src/calculator.py
   def add(a, b):
       if a < 0 or b < 0:
           raise ValueError("Negative numbers not supported")
       return a + b
   ```

6. **再次提交**
   ```bash
   git add .
   git commit -m "Add validation"
   ```

7. **执行分析**
   - 在VSCode中打开项目
   - 执行 `LLT: Analyze Maintenance`
   - 查看结果

---

## 常见问题

### Q: 如何知道后端接口是否被调用？

A: 查看VSCode输出面板（`Ctrl+Shift+U`），选择 "LLT Assistant" 查看日志。

### Q: 后端返回的数据格式不对怎么办？

A: 检查后端响应格式是否与 [API接口规范](./MODULE_ANALYSIS.md#api接口规范) 一致。

### Q: 如何调试API请求？

A: 在 `src/maintenance/api/maintenanceClient.ts` 中添加 `console.log` 查看请求和响应。

### Q: 扩展没有响应怎么办？

A: 
1. 检查后端URL配置
2. 检查网络连接
3. 查看输出面板的错误日志
4. 重启VSCode扩展开发主机（`F5`）

---

## 下一步

- 查看 [完整使用指南](./USAGE_GUIDE.md) 了解详细功能
- 查看 [模块解析](./MODULE_ANALYSIS.md) 了解代码实现


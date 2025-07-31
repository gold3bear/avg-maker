# AI配置文件说明

这个目录包含AVG Maker的AI助手配置文件。在开发环境中，配置数据会保存在这里方便查看和编辑。

## 文件结构

### `ai-models.json`
存储所有AI模型的配置信息，包括：
- `id`: 模型的唯一标识符
- `name`: 模型显示名称
- `provider`: 服务提供商 (`openai`, `qwen`, `anthropic`, `custom`)
- `apiUrl`: API接口地址
- `apiKey`: API密钥（请妥善保管，不要泄露）
- `model`: 模型名称/ID
- `temperature`: 温度参数 (0-2)，控制回答的随机性
- `maxTokens`: 最大生成token数
- `systemPrompt`: 系统提示词，定义AI的角色和行为
- `headers`: 自定义请求头（仅自定义提供商）

### `selected-ai-model.txt`
存储当前选中的AI模型ID。

### `storage-config.json`
存储配置选项：
- `storageType`: 存储类型
  - `"localStorage"`: 仅使用localStorage（开发者工具可见）
  - `"file"`: 仅使用文件存储（重启保留）
  - `"hybrid"`: 双重存储（推荐）
- `enableLocalStorageSync`: 是否同步到localStorage用于开发者工具查看

### `chat-sessions.json`
存储AI助手的历史会话记录：
- `id`: 会话唯一标识符
- `title`: 会话标题（自动从首条用户消息生成）
- `messages`: 会话中的所有消息记录
- `createdAt`: 会话创建时间
- `updatedAt`: 会话最后更新时间
- `modelId`: 使用的AI模型ID
- `messageCount`: 消息总数
- `preview`: 会话预览文本（用于历史列表显示）

自动限制保存最近100个会话，按更新时间排序。

## 示例文件

本目录中的 `*.example.*` 文件是配置模板，你可以：

1. 复制示例文件并去掉 `.example` 后缀
2. 修改其中的API密钥和其他配置
3. 根据需要添加或删除模型配置

## 安全注意事项

⚠️ **重要提醒**：
- API密钥是敏感信息，请妥善保管
- 不要将包含真实API密钥的配置文件提交到版本控制系统
- 建议定期轮换API密钥
- 确保只有授权人员能访问这些配置文件

## 支持的AI提供商

### OpenAI
- **API地址**: `https://api.openai.com/v1/chat/completions`
- **模型示例**: `gpt-4-turbo-preview`, `gpt-3.5-turbo`
- **密钥格式**: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 通义千问 (Qwen)
- **API地址**: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- **模型示例**: `qwen-turbo`, `qwen-plus`, `qwen-max`
- **密钥格式**: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Anthropic Claude
- **API地址**: `https://api.anthropic.com/v1/messages`
- **模型示例**: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`
- **密钥格式**: `sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 自定义提供商
- 支持兼容OpenAI格式的任何API
- 可以自定义请求头
- 适用于本地部署的模型或其他第三方服务

## 预设系统提示词类型

AVG Maker提供以下预设系统提示词类型：

1. **小说创作专家** (`novelist`): 专注于角色设计、世界观构建、剧情创作
2. **Ink脚本程序员** (`coder`): 专注于Ink语法、代码优化、技术指导
3. **剧情分析师** (`analyzer`): 专注于故事结构分析、逻辑检查、改进建议
4. **创作导师** (`teacher`): 专注于新手指导、概念解释、学习支持

你也可以自定义系统提示词来定制AI的行为。

## 故障排除

如果遇到配置问题：

1. 检查JSON文件格式是否正确
2. 确认API密钥是否有效
3. 验证API地址是否可访问
4. 使用应用内的"验证存储状态"功能检查配置

## 开发调试

在开发环境中，可以使用以下控制台命令：

```javascript
// 验证存储状态
window.__DEV_TESTING__.aiStorage.verify()

// 查看内存中的数据
window.__DEV_TESTING__.aiStorage.showMemoryData()

// 重新加载配置
window.__DEV_TESTING__.aiStorage.reload()

// 清除所有配置（谨慎使用）
window.__DEV_TESTING__.aiStorage.clear()
```
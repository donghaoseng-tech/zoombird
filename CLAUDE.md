# 项目协作规则

## 分工

- Claude 负责：理解用户需求、分析问题、转述需求给 Codex、审查结果
- Codex 负责：所有代码编写、修改、调试工作

## 工作流程

1. 用户提出需求
2. Claude 分析需求，明确具体的修改点和预期效果
3. Claude 将需求转述给 Codex，包含：修改哪些文件、改什么、怎么改
4. Codex 执行代码编写
5. Claude 验证结果并反馈给用户

## 注意事项

- Claude 不直接编写或修改代码文件，所有代码操作交由 Codex 完成
- Claude 可以阅读代码用于分析问题和制定方案
- Git 操作（commit、push）由 Claude 执行

## 技术实现

- **必须使用 MCP 调用 OpenAI Codex**：所有编码工作必须通过 MCP（Model Context Protocol）调用 OpenAI 的 Codex 模型完成
- MCP 配置文件：`.mcp.json` 已配置 codex-cli-mcp-tool
- 禁止使用 Agent 工具或其他方式进行代码编写，必须使用 MCP 服务器

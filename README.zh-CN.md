# Nano Banana by Ace Data Cloud：Activepieces 插件

通过 Ace Data Cloud 创建 Nano Banana 图片，并按**同一任务 ID**查询。这是 Ace 提供的独立集成，不冒充 Nano Banana 官方产品。[English](README.md)

**2026-10-18 状态：**`@acedatacloud/piece-nano-banana@0.1.0` 仍为源码候选。npm 发布、真实实例安装、官方目录可搜索分别待验；不能把本地构建或仓库存在当作上架。

## 1. 官方安装入口与实例安装

参照 [Activepieces 官方社区发布文档](https://www.activepieces.com/docs/build-pieces/sharing-pieces/community)。包发布后，CE 0.92.2+ 管理员进入 **Platform Admin → Catalogue → Pieces → Install Piece → NPM Registry**，输入包名与已核实版本。安装后在流程搜索 **Nano Banana**，核对 **Nano Banana by Ace Data Cloud**、Ace Logo 和创建/查询两个动作。

![官方文档中的安装弹窗，仅作界面参考](docs/screenshots/install-piece.png)

该图来自 Activepieces 官方文档，2026-10-18 取回，不是本候选已安装截图。官方当前暂停外部主动主仓 PR，允许外部 npm 包；官方共享目录收录尚未完成。

## 2. 注册、登录并获取 API Key

1. 进入 [Ace Applications](https://platform.acedata.cloud/console/applications?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=nano_banana_activepieces_readme_api_key) 注册或登录；没有通用应用时点击 **Initialize General Application**。
2. 打开通用应用或具有 **Nano Banana** 权限的专用应用。通用 Key 可访问账号有权使用的服务，专用 Key 只限对应服务。创建前查看[当前价格与余额](https://platform.acedata.cloud/models?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=nano_banana_activepieces_readme_pricing)。
3. 用图中 **1** 的复制按钮复制 Key，或 **2** 的 **Manage Keys** 管理独立密钥。

![复制 Key 或管理密钥：已脱敏真实控制台图](docs/screenshots/get-api-key-en.png)

4. **Manage Keys → Create**，命名 `Activepieces Nano Banana`，按需设置有效期与用量限制；启用 Allowed APIs 时同时包含 `/nano-banana/images` 与 `/nano-banana/tasks`，创建后复制。

![创建独立 Key：已脱敏真实控制台图](docs/screenshots/create-api-key-en.png)

截图沿用固定版本 Ace 控制台原图，[来源与边界](docs/screenshots/source.json)保留，不含可用凭据，也不证明本服务新调用。Activepieces 的 **Connection → Ace Data Cloud API key** 只粘贴 Key 本身，不加 `Bearer `；`platform-...` 管理 Token 不能用于生成。不要把 Key 写进流程导出。

## 3. 首用与异步结果

1. 导入[无密钥流程](examples/quickstart.json)：手动触发→创建→查询；实例另需官方 manual-trigger 0.0.8。
2. 两个动作分别选择自己的连接，模型 `nano-banana-2-lite`，样例参数 1 张、1K、1:1；先查实时价格，样例不保证价格。
3. 创建只执行一次，保存 task_id；查询已映射同一 ID。pending 时只重复查询，不把创建放进轮询。
4. 仅终态 succeeded/success=true 使用 media_urls；到[请求记录](https://platform.acedata.cloud/console/usages?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=nano_banana_activepieces_readme_request_history)核对一次创建与 Credits 扣费。查询不会再次创建内容。

首版仅支持文生图，尚不暴露编辑动作。源码测试未发付费请求。401/403 核 Key/权限，400 核模型参数，429 降并发；创建超时/5xx 先查记录，避免重复计费。HTTP 与样例创建均不自动重试。

仅向 api.acedata.cloud 发送输入和 Key，验证证书、清理内部路由输出；暂不支持 HTTPS 代理配置。价格与账单使用 Credits，不能直接当 USD。开发运行 npm ci --legacy-peer-deps --ignore-scripts、npm test、npm pack --dry-run。更多动作与排障见英文指南。

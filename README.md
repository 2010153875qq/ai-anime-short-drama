# 星渊 AI 漫剧工坊 · Grok Imagine V0.1

手机优先的 3D 仙侠单镜头视频生成原型。复用现有仓库，不影响其他项目。

## 已实现
- Cloudflare Worker 后端代理 xAI 视频 API：提交生成任务、按 request_id 查询结果
- 最长 10 秒、固定 9:16 / 480p、仅允许 1.5 或 1.5-lite 模型
- 简单管理员口令保护（首版单用户原型），xAI Key 不暴露到浏览器
- 中文移动端界面、视频预览、手动审核清单
- **不会**自动生成下一镜头、不会自动轮询、不会自动重试收费请求、不会自动识别人物变脸

## iPhone + GitHub + Cloudflare 部署
1. 在 GitHub 合并功能分支到 main。
2. 登录 https://dash.cloudflare.com/ ，到 Workers & Pages → Create application → GitHub，选择此仓库，连接 GitHub，构建命令留空，部署命令如控制台未自动识别请设为 `npx wrangler deploy`。
3. 在 Worker → Settings → Variables and Secrets 新增两项 **Secret**（不是明文变量）：`XAI_API_KEY` 为在 https://console.x.ai/ 创建的密钥；`APP_ADMIN_TOKEN` 为自己生成的高强度随机管理员口令（建议 32 字符以上）。
4. 部署后打开 Worker 的 workers.dev 地址；输入管理员口令，先用 5 秒、480p、1.5 Lite 测试。
5. xAI 接口会按照任务计费。先在 xAI 控制台设置小额度预算或预付额度；不要把 API Key 发到聊天或提交到 GitHub。

## 生产上线前必须补充
- 目前仅是单用户演示版，口令验证缺少服务端账号体系、请求速率限制及强制用量配额。**不要公开分享管理员口令。**
- 需要 Cloudflare Access 或完善身份认证、后台计费限额、持久任务数据库及 R2 媒体存储。
- xAI 生成视频的 URL 可能过期，须自行下载；自动媒体保存尚未实现。
- 人物一致性及动作评分须新增视觉审核模型，目前仅人工审核。
- 未取得 API Key 和 Cloudflare 部署权限前，不能声明真实调用测试已经成功。

## API
- `GET /health`: 检查 Worker 运行与密钥是否配置（不显示密钥）
- `POST /api/generate`: Authorization: Bearer APP_ADMIN_TOKEN，JSON `{prompt, duration, model}`
- `GET /api/status/:request_id`: 同样鉴权，返回 xAI 的视频任务结果

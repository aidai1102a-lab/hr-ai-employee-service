# 零本地环境上线指南

适合 HR 同事使用：不安装 Node.js、不安装 npm、不安装 Docker、不安装数据库、不打开终端。全程只用浏览器。

## 你最终会得到什么

- 一个公网网址，例如 `https://hr-ai-your-company.vercel.app`
- 员工 AI 聊天页面
- Admin 后台
- 知识库上传页面
- 工单/转人工页面
- 钉钉机器人 webhook 地址

## 需要注册的平台

1. GitHub：存放项目文件。
2. Supabase：云数据库，保存账号、聊天、知识库、工单。
3. OpenAI Platform：提供 AI 问答能力。
4. Vercel：一键部署网站。
5. 钉钉开放平台：配置机器人和 OAuth。

## 最简单路线

```text
GitHub 在线上传代码
→ Supabase 创建云数据库
→ OpenAI 创建 API Key
→ Vercel 导入 GitHub 仓库
→ 填环境变量
→ Deploy
→ 获得公网网址
```

## 第一步：GitHub 创建仓库

1. 打开 https://github.com/new
2. Repository name 填：`hr-ai-employee-service`
3. 选择 `Private`
4. 点击 `Create repository`
5. 进入仓库后，点击 `uploading an existing file`
6. 把项目文件上传进去
7. 点击 `Commit changes`

提示：如果网页一次上传文件夹不顺利，可以先上传我生成的项目压缩包，或者让有 GitHub 权限的同事帮你把文件导入仓库。

## 第二步：Supabase 创建数据库

1. 打开 https://supabase.com/dashboard
2. 点击 `New project`
3. Organization 选择你的组织
4. Project name 填：`hr-ai`
5. Database Password 设置一个强密码，保存好
6. Region 选择离员工近的地区
7. 点击 `Create new project`
8. 等项目创建完成

### 初始化数据库

1. 进入 Supabase 项目
2. 左侧点击 `SQL Editor`
3. 点击 `New query`
4. 打开本项目的 `docs/supabase-init.sql`
5. 全部复制进去
6. 点击 `Run`

### 复制数据库连接串

1. 进入 Supabase 项目
2. 顶部或侧边找到 `Connect`
3. 选择 `Transaction pooler` 或 `Session pooler`
4. 复制连接串
5. 把 `[YOUR-PASSWORD]` 替换成你创建项目时的数据库密码

给 Vercel 用：

- `DATABASE_URL`：优先用 Transaction pooler
- `DIRECT_URL`：可以用 Direct connection 或 Session pooler

## 第三步：OpenAI 创建 API Key

1. 打开 https://platform.openai.com/api-keys
2. 登录
3. 点击 `Create new secret key`
4. 名称填：`hr-ai-vercel`
5. 复制生成的 key
6. 保存到安全位置

注意：这个 key 只显示一次。

## 第四步：Vercel 部署

1. 打开 https://vercel.com/new
2. 选择 `Import Git Repository`
3. 选择刚才 GitHub 的 `hr-ai-employee-service`
4. Framework Preset 选择 `Next.js`
5. 展开 `Environment Variables`
6. 添加下面这些变量：

```text
DATABASE_URL=你的 Supabase pooler 数据库连接串
DIRECT_URL=你的 Supabase direct/session 数据库连接串
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_CHAT_MODEL=gpt-4.1
OPENAI_FAST_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
JWT_SECRET=一串足够长的随机文字，例如 hr-ai-your-company-2026-long-secret
APP_URL=先留空，部署后再改成 Vercel 网址
UPLOAD_DIR=/tmp/uploads
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60
DINGTALK_WEBHOOK_TOKEN=change-this-token
DINGTALK_ROBOT_WEBHOOK=先留空
DINGTALK_ROBOT_SECRET=先留空
DINGTALK_APP_KEY=先留空
DINGTALK_APP_SECRET=先留空
DINGTALK_CORP_ID=先留空
SUPPORT_DINGTALK_WEBHOOK=先留空
```

7. 点击 `Deploy`
8. 等待部署完成
9. Vercel 会显示一个网址，例如 `https://hr-ai-employee-service.vercel.app`
10. 回到项目 Settings → Environment Variables，把 `APP_URL` 改成这个网址
11. 点击 Vercel 项目页的 `Redeploy`

## 第五步：登录测试

打开：

```text
https://你的-vercel-网址/login
```

默认管理员：

```text
admin@company.com
Admin@123456
```

测试员工：

```text
employee@company.com
Employee@123
```

建议上线后立刻在 Admin 后台创建新管理员，并停用默认账号。

## 第六步：上传知识库

1. 登录 Admin
2. 进入 `/knowledge`
3. 上传 PDF / DOCX / TXT / Markdown / Excel
4. 填部门、国家、权限
5. 上传完成后，回到聊天页提问测试

## 第七步：钉钉机器人

部署完成后，你的钉钉 webhook 接收地址是：

```text
https://你的-vercel-网址/api/dingtalk/webhook?token=你的DINGTALK_WEBHOOK_TOKEN
```

配置步骤：

1. 打开钉钉开放平台
2. 创建企业内部应用或机器人
3. 消息接收地址填上面的 webhook
4. 如果使用群机器人，把机器人 Webhook 和加签 Secret 填到 Vercel 环境变量：
   - `DINGTALK_ROBOT_WEBHOOK`
   - `DINGTALK_ROBOT_SECRET`
5. 回 Vercel 点击 Redeploy

## 常见问题

### 我不懂数据库连接串怎么办？

只需要在 Supabase 点 `Connect`，复制 pooler 字符串，替换密码，然后粘到 Vercel 环境变量。

### 我不想公开代码怎么办？

GitHub 仓库选 `Private`，Vercel 可以部署 private repository。

### 知识库上传后没有回答怎么办？

检查：

- OpenAI API Key 是否有效
- Supabase SQL 是否已运行
- 文件是否显示 `READY`
- 问题是否和上传文档内容相关

### Vercel 部署失败怎么办？

打开 Vercel 项目 → Deployments → 点失败记录 → 查看红色错误。最常见是环境变量漏填。


# AI 学习维基

[English](README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md)

一个现代化、沉浸式且高度互动的学习平台,用户可以通过 AI 生成的维基页面和智能问答来探索知识。

![AI 学习维基界面展示](public/screenshots/app-interface-en.png)
*AI 学习维基的交互界面，展示现金再融资主题页面*

## 功能特色

### 动态维基系统
- AI 生成的完整维基页面,具有丰富的格式
- 智能"相关主题"侧边栏,用于探索相关概念
- 智能链接和渐进式知识构建
- 情境感知的内容生成

### AI 驱动的交互
- 每个页面都有自然语言问题输入
- 基于当前主题和学习路径的情境感知答案
- 相关问题的智能建议
- 自动检测现有与新主题,避免重复

### 用户体验
- 保存学习会话和自定义知识库
- 面包屑导航显示学习路径历史
- 收藏最爱的维基页面
- 搜索所有生成的内容
- 针对桌面和平板电脑优化的响应式设计
- 简洁、极简的设计,具有优雅的渐变和流畅的过渡效果

### 知识管理
- 幕后的思维导图结构组织知识图谱
- 由知识结构引导的智能内容生成
- 所有页面和会话的持久化 SQLite 数据库存储
- 多数据库支持,用于组织不同的学习库
- 可导出的维基页面

## 开始使用

### 前置要求
- 已安装 Node.js 18+
- 从 [OpenAI Platform](https://platform.openai.com/api-keys) 获取 OpenAI API 密钥

### 安装

1. 克隆仓库并安装依赖包:
```bash
npm install
```

2. 配置您的 OpenAI API:
   - 复制示例环境文件:
```bash
cp .env.sample .env.local
```
   - 编辑 `.env.local` 并添加您的 OpenAI API 密钥:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```
   - 可选:自定义模型(默认: gpt-5):
```env
OPENAI_MODEL=gpt-4o  # 选项: gpt-5, gpt-4o, gpt-4o-mini, gpt-4-turbo-preview, gpt-3.5-turbo
```
   - 可选:使用不同的 API 端点(用于 Azure OpenAI 或其他提供者):
```env
OPENAI_API_BASE_URL=https://api.openai.com/v1  # 默认 OpenAI 端点
```

3. 运行开发服务器:
```bash
npm run dev
```

4. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## 使用方法

1. **开始学习**:在搜索框中输入任何主题以生成完整的维基页面
2. **提出问题**:使用问题输入来深入探讨任何概念
3. **探索相关主题**:点击侧边栏或页面内容中的相关主题
4. **收藏页面**:保存重要页面以便稍后快速访问
5. **追踪进度**:在侧边栏面包屑中查看您的学习路径
6. **搜索**:使用搜索功能查找先前生成的内容

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript
- **样式**: Tailwind CSS 4,具有自定义渐变和动画
- **图标**: Lucide React
- **Markdown**: React Markdown 用于丰富的内容渲染
- **AI**: OpenAI API(支持 GPT-5、GPT-4o、GPT-4o-mini 和 GPT-3.5-turbo)
- **存储**: 服务器端 SQLite 数据库,使用 better-sqlite3

## 架构

### 组件
- `TopicSearch`:初始主题输入界面
- `WikiPage`:具有 markdown 渲染的丰富维基页面显示
- `QuestionInput`:每个页面的显著问题输入
- `Sidebar`:导航、收藏和学习路径

### 核心系统
- `lib/ai-service.ts`:AI 驱动的维基生成和问答
- `lib/storage.ts`:用于页面、会话、收藏和思维导图的存储 API 客户端层
- `lib/db.ts`:使用 better-sqlite3 的 SQLite 数据库层
- `lib/types.ts`:TypeScript 类型定义
- `app/api/generate/route.ts`:AI 内容生成的 API 端点
- `app/api/pages/route.ts`:维基页面的 CRUD 端点
- `app/api/sessions/route.ts`:学习会话管理
- `app/api/bookmarks/route.ts`:收藏管理
- `app/api/mindmap/route.ts`:知识图谱管理

### 数据流程
1. 用户输入主题或问题
2. 通过 API 检查内容是否已存在于 SQLite 数据库中
3. 如果不存在,通过 AI API 生成新内容
4. 更新思维导图结构以维护知识图谱
5. 通过 API 保存到 SQLite 数据库并更新 UI
6. 在学习会话中跟踪以进行导航

## 自定义配置

### API 配置
编辑 `.env.local` 以自定义:
- 模型选择:`OPENAI_MODEL`(默认: gpt-5)
  - 选项: gpt-5、gpt-4o、gpt-4o-mini、gpt-4-turbo-preview、gpt-3.5-turbo
  - 注意: gpt-5 需要 OpenAI 的特殊访问权限
- API 端点:`OPENAI_API_BASE_URL`(用于 Azure OpenAI 或其他提供者)

编辑 `app/api/generate/route.ts` 以进行高级配置:
- Temperature(默认: 非 GPT-5 模型为 0.7)
- 最大完成令牌数(默认: 16000)
- 响应格式(JSON 对象)
- 请求超时(默认: 2 分钟)

### 样式
- 修改 `app/globals.css` 以配置全局样式
- 更新组件中的 Tailwind 类以进行视觉更改
- 渐变使用蓝-靛-紫调色板

### 内容生成
编辑 `lib/ai-service.ts` 中的提示以自定义:
- 维基页面结构和语调
- 相关主题建议
- 问答风格

## 详细功能

### 思维导图知识结构
- 组织所有主题的隐形图形结构
- 页面之间的父子关系
- 知识层次的深度跟踪
- 基于情境的智能链接

### 学习会话
- 首次主题时自动创建会话
- 面包屑导航(最近 10 个页面)
- 页面计数跟踪
- 会话持久化于 SQLite 数据库
- 在浏览器重启和页面刷新后仍然保留

### 智能去重
- 主题的精确匹配检测
- 类似问题检测
- 尽可能重复使用现有内容
- 基于标题 + 时间戳的一致页面 ID

## 开发

```bash
# 运行开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# Lint 代码
npm run lint
```

## 浏览器支持

支持以下功能的现代浏览器:
- ES6+ JavaScript 支持
- CSS Grid 和 Flexbox
- Fetch API
- 推荐: 最新版本的 Chrome、Firefox、Safari 或 Edge

## 许可证

本项目采用 GNU Affero 通用公共许可证 v3.0 (AGPL-3.0) 授权 - 详情请参阅 [LICENSE](LICENSE) 文件。

AGPL-3.0 是一个自由的 copyleft 许可证，要求任何在服务器上运行本软件修改版本的人必须向用户提供修改后的源代码。

## 贡献

欢迎贡献!请随时提交 Pull Request。

# AI 學習維基

[English](README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md)

一個現代化、沉浸式且高度互動的學習平台，使用者可以透過 AI 生成的維基頁面和智慧問答來探索知識。

## 功能特色

### 動態維基系統
- AI 生成的完整維基頁面，具有豐富的格式
- 智慧「相關主題」側邊欄，用於探索相關概念
- 智慧連結和漸進式知識建構
- 情境感知的內容生成

### AI 驅動的互動
- 每個頁面都有自然語言問題輸入
- 基於當前主題和學習路徑的情境感知答案
- 相關問題的智慧建議
- 自動檢測現有與新主題，避免重複

### 使用者體驗
- 儲存學習會話和自訂知識庫
- 麵包屑導航顯示學習路徑歷史
- 收藏最愛的維基頁面
- 搜尋所有生成的內容
- 針對桌面和平板電腦優化的響應式設計
- 簡潔、極簡的設計，具有優雅的漸層和流暢的過渡效果

### 知識管理
- 幕後的心智圖結構組織知識圖譜
- 由知識結構引導的智慧內容生成
- 所有頁面和會話的持久化 SQLite 資料庫儲存
- 多資料庫支援，用於組織不同的學習資料庫
- 可匯出的維基頁面

## 開始使用

### 前置需求
- 已安裝 Node.js 18+
- 從 [OpenAI Platform](https://platform.openai.com/api-keys) 取得 OpenAI API 金鑰

### 安裝

1. 複製儲存庫並安裝相依套件：
```bash
npm install
```

2. 設定您的 OpenAI API：
   - 複製範例環境檔案：
```bash
cp .env.sample .env.local
```
   - 編輯 `.env.local` 並新增您的 OpenAI API 金鑰：
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```
   - 選用：自訂模型（預設：gpt-5）：
```env
OPENAI_MODEL=gpt-4o  # 選項：gpt-5, gpt-4o, gpt-4o-mini, gpt-4-turbo-preview, gpt-3.5-turbo
```
   - 選用：使用不同的 API 端點（用於 Azure OpenAI 或其他提供者）：
```env
OPENAI_API_BASE_URL=https://api.openai.com/v1  # 預設 OpenAI 端點
```

3. 執行開發伺服器：
```bash
npm run dev
```

4. 在瀏覽器中開啟 [http://localhost:3000](http://localhost:3000)

## 使用方法

1. **開始學習**：在搜尋框中輸入任何主題以生成完整的維基頁面
2. **提出問題**：使用問題輸入來深入探討任何概念
3. **探索相關主題**：點擊側邊欄或頁面內容中的相關主題
4. **收藏頁面**：儲存重要頁面以便稍後快速存取
5. **追蹤進度**：在側邊欄麵包屑中查看您的學習路徑
6. **搜尋**：使用搜尋功能尋找先前生成的內容

## 技術堆疊

- **前端**：Next.js 16, React 19, TypeScript
- **樣式**：Tailwind CSS 4，具有自訂漸層和動畫
- **圖示**：Lucide React
- **Markdown**：React Markdown 用於豐富的內容渲染
- **AI**：OpenAI API（支援 GPT-5、GPT-4o、GPT-4o-mini 和 GPT-3.5-turbo）
- **儲存**：伺服器端 SQLite 資料庫，使用 better-sqlite3

## 架構

### 元件
- `TopicSearch`：初始主題輸入介面
- `WikiPage`：具有 markdown 渲染的豐富維基頁面顯示
- `QuestionInput`：每個頁面的顯著問題輸入
- `Sidebar`：導航、收藏和學習路徑

### 核心系統
- `lib/ai-service.ts`：AI 驅動的維基生成和問答
- `lib/storage.ts`：用於頁面、會話、收藏和心智圖的儲存 API 客戶端層
- `lib/db.ts`：使用 better-sqlite3 的 SQLite 資料庫層
- `lib/types.ts`：TypeScript 類型定義
- `app/api/generate/route.ts`：AI 內容生成的 API 端點
- `app/api/pages/route.ts`：維基頁面的 CRUD 端點
- `app/api/sessions/route.ts`：學習會話管理
- `app/api/bookmarks/route.ts`：收藏管理
- `app/api/mindmap/route.ts`：知識圖譜管理

### 資料流程
1. 使用者輸入主題或問題
2. 透過 API 檢查內容是否已存在於 SQLite 資料庫中
3. 如果不存在，透過 AI API 生成新內容
4. 更新心智圖結構以維護知識圖譜
5. 透過 API 儲存到 SQLite 資料庫並更新 UI
6. 在學習會話中追蹤以進行導航

## 自訂設定

### API 設定
編輯 `.env.local` 以自訂：
- 模型選擇：`OPENAI_MODEL`（預設：gpt-5）
  - 選項：gpt-5、gpt-4o、gpt-4o-mini、gpt-4-turbo-preview、gpt-3.5-turbo
  - 注意：gpt-5 需要 OpenAI 的特殊存取權限
- API 端點：`OPENAI_API_BASE_URL`（用於 Azure OpenAI 或其他提供者）

編輯 `app/api/generate/route.ts` 以進行進階設定：
- Temperature（預設：非 GPT-5 模型為 0.7）
- 最大完成令牌數（預設：16000）
- 回應格式（JSON 物件）
- 請求逾時（預設：2 分鐘）

### 樣式
- 修改 `app/globals.css` 以設定全域樣式
- 更新元件中的 Tailwind 類別以進行視覺變更
- 漸層使用藍-靛-紫色調色板

### 內容生成
編輯 `lib/ai-service.ts` 中的提示以自訂：
- 維基頁面結構和語調
- 相關主題建議
- 問答風格

## 詳細功能

### 心智圖知識結構
- 組織所有主題的隱形圖形結構
- 頁面之間的父子關係
- 知識階層的深度追蹤
- 基於情境的智慧連結

### 學習會話
- 首次主題時自動建立會話
- 麵包屑導航（最近 10 個頁面）
- 頁面計數追蹤
- 會話持久化於 SQLite 資料庫
- 在瀏覽器重新啟動和頁面重新整理後仍然保留

### 智慧去重
- 主題的精確匹配檢測
- 類似問題檢測
- 盡可能重複使用現有內容
- 基於標題 + 時間戳的一致頁面 ID

## 開發

```bash
# 執行開發伺服器
npm run dev

# 建置正式版本
npm run build

# 啟動正式伺服器
npm start

# Lint 程式碼
npm run lint
```

## 瀏覽器支援

支援以下功能的現代瀏覽器：
- ES6+ JavaScript 支援
- CSS Grid 和 Flexbox
- Fetch API
- 建議：最新版本的 Chrome、Firefox、Safari 或 Edge

## 授權條款

MIT

## 貢獻

歡迎貢獻！請隨時提交 Pull Request。

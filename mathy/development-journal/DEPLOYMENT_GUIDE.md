# Deployment Guide: claritynotes.co

## 方案選擇

由於 `claritynotes.co` 已經被 landing page 使用，我們有兩個選擇：

### 方案 1: 子域名（推薦）⭐
- `claritynotes.co` → Landing Page (另一個 repo)
- `app.claritynotes.co` → 產品應用 (這個 repo)

**優點：**
- 兩個項目完全獨立
- 易於管理和維護
- 可以分別部署和更新
- 符合常見的 SaaS 架構模式

### 方案 2: 路徑路由
- `claritynotes.co` → Landing Page
- `claritynotes.co/app` → 產品應用

**缺點：**
- 需要兩個項目在同一個 Vercel 項目中
- 或使用 rewrites 配置，較複雜

---

## 推薦方案：使用子域名 `app.claritynotes.co`

### 步驟 1: 在 Vercel 配置域名

1. **進入 Vercel 項目設置**
   - 打開你的 Vercel 項目
   - 進入 **Settings** → **Domains**

2. **添加子域名**
   - 點擊 **Add Domain**
   - 輸入：`app.claritynotes.co`
   - 選擇 **Add**

3. **配置 DNS 記錄（GoDaddy）**
   
   **步驟 A: 在 Vercel 獲取配置信息**
   - 添加域名後，Vercel 會顯示需要添加的 DNS 記錄
   - 通常會顯示類似：
     ```
     類型: CNAME
     名稱: app
     值: cname.vercel-dns.com
     ```
   - 或者可能是 A 記錄（如果 Vercel 提供 IP 地址）
   
   **步驟 B: 在 GoDaddy 添加 DNS 記錄**
   
   1. **登錄 GoDaddy**
      - 訪問 [godaddy.com](https://godaddy.com)
      - 登錄你的帳戶
   
   2. **進入域名管理**
      - 點擊右上角 **My Products**
      - 找到 `claritynotes.co` 域名
      - 點擊 **DNS** 或 **Manage DNS**
   
   3. **添加 CNAME 記錄**
      - 在 DNS 記錄列表中，點擊 **Add** 或 **+ Add Record**
      - 選擇記錄類型：**CNAME**
      - 填寫以下信息：
        ```
        類型: CNAME
        名稱: app
        值: cname.vercel-dns.com
        TTL: 600 (或使用默認值)
        ```
      - **重要：** 名稱只填 `app`，不要填 `app.claritynotes.co`
      - 點擊 **Save** 保存
   
   4. **驗證記錄**
      - 記錄應該顯示為：
        ```
        app  CNAME  cname.vercel-dns.com
        ```
      - 如果看到 `app.claritynotes.co`，那是正常的（GoDaddy 會自動添加域名後綴）

4. **等待 DNS 傳播**
   - DNS 記錄通常需要 **5-30 分鐘** 生效
   - 最多可能需要 **24-48 小時**（但通常很快）
   - 可以在 Vercel 中查看驗證狀態
   - 使用命令行驗證：
     ```bash
     # 檢查 DNS 記錄
     dig app.claritynotes.co
     # 或
     nslookup app.claritynotes.co
     ```

### 步驟 2: 更新 Supabase 配置

1. **進入 Supabase Dashboard**
   - 打開你的 Supabase 項目
   - 進入 **Authentication** → **URL Configuration**

2. **更新 Site URL**
   ```
   https://app.claritynotes.co
   ```

3. **更新 Redirect URLs**（每行一個）
   ```
   https://app.claritynotes.co/auth/callback
   http://localhost:3000/auth/callback
   http://localhost:3001/auth/callback
   https://claritynotes-git-canvas-feature-anderson120912091209s-projects.vercel.app/auth/callback
   ```

### 步驟 3: 更新環境變量（可選）⚠️

**注意：** 目前代碼使用 `window.location.origin` 動態獲取 URL，所以**不需要**設置這個環境變量。這一步是可選的。

如果你的代碼中有硬編碼的 URL，或者將來需要使用環境變量，可以設置：

1. **Vercel 環境變量**（如果需要）
   - 進入 **Settings** → **Environment Variables**
   - 添加（如果代碼中使用了）：
     ```
     名稱: NEXT_PUBLIC_APP_URL
     值: https://app.claritynotes.co
     ```

2. **本地 `.env.local`**（開發用，可選）
   ```bash
   NEXT_PUBLIC_APP_URL=https://app.claritynotes.co
   ```
   
   **目前不需要設置**，因為：
   - ✅ `AuthContext.tsx` 使用 `window.location.origin`（已正確）
   - ✅ `auth/callback/route.ts` 使用 `requestUrl.origin`（已正確）
   - ✅ 代碼中沒有使用 `NEXT_PUBLIC_APP_URL` 環境變量

### 步驟 4: 驗證部署

1. **訪問新域名**
   - 打開 `https://app.claritynotes.co`
   - 確認頁面正常加載

2. **測試登錄流程**
   - 點擊登錄
   - 確認重定向到正確的回調 URL
   - 確認登錄後重定向到 `/notebook`

3. **檢查控制台**
   - 打開瀏覽器開發者工具
   - 確認沒有 CORS 或重定向錯誤

---

## 代碼檢查清單

確保以下代碼能正確處理新域名：

- [x] `AuthContext.tsx` - 使用 `window.location.origin`（已正確）
- [x] `auth/callback/route.ts` - 使用 `requestUrl.origin`（已正確）
- [ ] 檢查是否有硬編碼的 URL
- [ ] 檢查是否有 CORS 配置需要更新

---

## 常見問題

### Q: DNS 記錄添加後多久生效？
A: 通常 5-30 分鐘，最多可能需要 24-48 小時。

### Q: 如何確認 DNS 已生效？
A: 有幾種方法：

**方法 1: 使用命令行工具**
```bash
# macOS/Linux
dig app.claritynotes.co
# 或
nslookup app.claritynotes.co

# Windows
nslookup app.claritynotes.co
```

**方法 2: 使用在線工具**
- 訪問 [whatsmydns.net](https://www.whatsmydns.net)
- 輸入 `app.claritynotes.co`
- 選擇 **CNAME** 記錄類型
- 查看全球 DNS 傳播狀態

**方法 3: 在 Vercel 中查看**
- 進入 Vercel 項目 → Settings → Domains
- 查看域名狀態，應該顯示 "Valid Configuration" 或 "Ready"

### Q: GoDaddy DNS 記錄添加後沒有立即生效？
A: 
- 通常需要 5-30 分鐘
- 清除瀏覽器緩存
- 嘗試使用無痕模式訪問
- 如果超過 1 小時仍未生效，檢查記錄是否正確輸入

### Q: 在 GoDaddy 中，名稱應該填什麼？
A: 
- ✅ 正確：只填 `app`
- ❌ 錯誤：`app.claritynotes.co`
- GoDaddy 會自動添加域名後綴，所以只填子域名部分即可

### Q: 兩個域名可以同時使用嗎？
A: 可以！你可以同時保留：
- `app.claritynotes.co`（新域名）
- `claritynotes-git-canvas-feature-anderson120912091209s-projects.vercel.app`（Vercel 默認域名）

### Q: 登錄時出現 "deployment not found for app.claritynotes.co" 錯誤？
A: 這通常意味著 Vercel 還沒有識別到域名。請查看 `TROUBLESHOOTING_DEPLOYMENT.md` 文件獲取詳細的故障排查步驟。

**快速解決方法：**
1. 檢查 Vercel → Settings → Domains，確認域名狀態是 "Valid Configuration"
2. 驗證 DNS 記錄已正確配置（使用 `dig app.claritynotes.co`）
3. 觸發一次新的部署（推送代碼或手動觸發）
4. 等待 10-30 分鐘讓 DNS 和 Vercel 同步

### Q: 如何從 landing page 跳轉到產品？
A: 在 landing page 的 "Get Started" 按鈕添加：
```html
<a href="https://app.claritynotes.co/login">Get Started</a>
```

---

## 部署後測試

1. ✅ 訪問 `https://app.claritynotes.co` 正常
2. ✅ 登錄流程正常
3. ✅ 重定向到 `/notebook` 正常
4. ✅ 所有功能正常運作
5. ✅ 沒有控制台錯誤

---

## 備註

- 確保 SSL 證書已自動配置（Vercel 會自動處理）
- 如果使用 Cloudflare，確保 SSL/TLS 設置為 "Full" 或 "Full (strict)"
- 考慮設置重定向：將舊的 Vercel 域名重定向到新域名（可選）


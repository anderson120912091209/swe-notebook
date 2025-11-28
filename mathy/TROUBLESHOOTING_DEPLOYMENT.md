# 故障排查：deployment not found for app.claritynotes.co

## 🔍 問題診斷

當你看到 "deployment not found for app.claritynotes.co" 錯誤時，通常意味著：

1. **Vercel 還沒有識別到這個域名**
2. **DNS 記錄還沒有正確傳播**
3. **域名在 Vercel 中的狀態不是 "Ready"**

---

## ✅ 解決步驟

### 步驟 1: 檢查 Vercel 域名狀態

1. **登錄 Vercel Dashboard**
   - 訪問 [vercel.com/dashboard](https://vercel.com/dashboard)
   - 選擇你的項目

2. **檢查域名狀態**
   - 進入 **Settings** → **Domains**
   - 找到 `app.claritynotes.co`
   - 查看狀態：
     - ✅ **"Valid Configuration"** 或 **"Ready"** = 正常
     - ⚠️ **"Pending"** = 等待 DNS 傳播
     - ❌ **"Invalid Configuration"** = DNS 配置有問題

### 步驟 2: 驗證 DNS 記錄

#### 方法 1: 使用命令行檢查

```bash
# macOS/Linux
dig app.claritynotes.co

# Windows
nslookup app.claritynotes.co
```

**預期輸出應該包含：**
```
app.claritynotes.co.    CNAME   cname.vercel-dns.com.
```

#### 方法 2: 使用在線工具

1. 訪問 [whatsmydns.net](https://www.whatsmydns.net)
2. 輸入 `app.claritynotes.co`
3. 選擇 **CNAME** 記錄類型
4. 查看全球 DNS 傳播狀態

**如果 DNS 記錄不正確：**
- 回到 GoDaddy 檢查 CNAME 記錄
- 確認名稱是 `app`（不是 `app.claritynotes.co`）
- 確認值是 `cname.vercel-dns.com`（或 Vercel 提供的值）

### 步驟 3: 重新觸發部署

有時候需要觸發一次新的部署來讓 Vercel 識別域名：

1. **方法 A: 推送代碼觸發部署**
   ```bash
   git commit --allow-empty -m "Trigger deployment for domain"
   git push
   ```

2. **方法 B: 在 Vercel 中手動觸發**
   - 進入 **Deployments** 標籤
   - 點擊 **Redeploy** 按鈕
   - 選擇最新的部署

3. **方法 C: 重新添加域名**
   - 在 **Settings** → **Domains** 中
   - 刪除 `app.claritynotes.co`（如果存在）
   - 重新添加 `app.claritynotes.co`
   - 等待 Vercel 驗證

### 步驟 4: 檢查 GoDaddy DNS 記錄

1. **登錄 GoDaddy**
   - 訪問 [godaddy.com](https://godaddy.com)
   - 進入 **My Products** → **DNS**

2. **確認 CNAME 記錄存在**
   - 應該看到：
     ```
     類型: CNAME
     名稱: app
     值: cname.vercel-dns.com
     ```

3. **如果記錄不存在或錯誤：**
   - 刪除舊記錄（如果有）
   - 添加新記錄：
     - 類型：**CNAME**
     - 名稱：**app**（只填 app，不要填完整域名）
     - 值：**cname.vercel-dns.com**（或 Vercel 提供的值）
     - TTL：**600** 或 **1 Hour**

### 步驟 5: 等待 DNS 傳播

- **通常需要：** 5-30 分鐘
- **最多可能需要：** 1-24 小時
- **檢查方法：**
  - 使用 `dig` 或 `nslookup` 命令
  - 使用 [whatsmydns.net](https://www.whatsmydns.net) 查看全球狀態

### 步驟 6: 清除緩存並重試

1. **清除瀏覽器緩存**
   - 使用無痕模式訪問
   - 或清除瀏覽器緩存和 cookies

2. **清除 DNS 緩存**（可選）
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Windows
   ipconfig /flushdns
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

---

## 🎯 快速檢查清單

按照以下順序檢查：

- [ ] **Vercel 域名狀態** 是 "Valid Configuration" 或 "Ready"
- [ ] **DNS 記錄** 在 GoDaddy 中正確配置（CNAME: app → cname.vercel-dns.com）
- [ ] **DNS 傳播** 已完成（使用 dig/nslookup 驗證）
- [ ] **觸發了新部署**（推送代碼或手動觸發）
- [ ] **等待了足夠時間**（至少 10-30 分鐘）
- [ ] **清除緩存** 後重試訪問

---

## 🚨 常見錯誤和解決方案

### 錯誤 1: "Invalid Configuration"

**原因：** DNS 記錄配置錯誤或未找到

**解決：**
1. 檢查 GoDaddy 中的 CNAME 記錄
2. 確認名稱和值完全正確
3. 等待 DNS 傳播（可能需要更長時間）

### 錯誤 2: "Pending" 狀態一直不變

**原因：** DNS 記錄還沒有傳播到所有 DNS 服務器

**解決：**
1. 使用 `dig` 或 `nslookup` 檢查 DNS 記錄
2. 如果記錄存在但 Vercel 仍顯示 "Pending"，等待更長時間
3. 嘗試重新添加域名

### 錯誤 3: 可以訪問主頁但登錄時出錯

**原因：** Supabase 重定向 URL 配置問題

**解決：**
1. 檢查 Supabase Dashboard → Authentication → URL Configuration
2. 確認 `https://app.claritynotes.co/auth/callback` 在 Redirect URLs 列表中
3. 確認 Site URL 設置為 `https://app.claritynotes.co`

### 錯誤 4: DNS 記錄正確但 Vercel 仍找不到

**原因：** 需要觸發新的部署

**解決：**
1. 在 Vercel 中手動觸發重新部署
2. 或推送一個空的 commit 觸發部署
3. 等待部署完成後再測試

---

## 📞 需要更多幫助？

如果以上步驟都無法解決問題：

1. **檢查 Vercel 文檔**
   - [Vercel 域名配置](https://vercel.com/docs/concepts/projects/domains)
   - [Vercel DNS 故障排查](https://vercel.com/docs/concepts/projects/domains/troubleshooting)

2. **檢查 Vercel 狀態頁**
   - 確認 Vercel 服務正常運行

3. **聯繫支持**
   - Vercel 支持：[support.vercel.com](https://support.vercel.com)
   - 提供錯誤信息和 DNS 記錄截圖

---

## ✅ 成功標誌

當一切配置正確時，你應該看到：

1. ✅ Vercel 域名狀態顯示 **"Valid Configuration"** 或 **"Ready"**
2. ✅ 可以訪問 `https://app.claritynotes.co` 並看到你的應用
3. ✅ 登錄流程正常工作，沒有 "deployment not found" 錯誤
4. ✅ SSL 證書自動配置（瀏覽器顯示鎖圖標）


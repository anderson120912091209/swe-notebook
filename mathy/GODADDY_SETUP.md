# GoDaddy + Vercel 子域名配置完整指南

## 📋 快速步驟總覽

1. 在 Vercel 添加域名 `app.claritynotes.co`
2. 在 GoDaddy 添加 CNAME 記錄
3. 等待 DNS 傳播（5-30 分鐘）
4. 驗證配置

---

## 🔧 詳細步驟

### 步驟 1: 在 Vercel 添加域名

1. 登錄 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的項目
3. 進入 **Settings** → **Domains**
4. 點擊 **Add Domain**
5. 輸入：`app.claritynotes.co`
6. 點擊 **Add**

**Vercel 會顯示需要添加的 DNS 記錄，類似：**
```
類型: CNAME
名稱: app
值: cname.vercel-dns.com
```

**記下這個值，下一步會用到！**

---

### 步驟 2: 在 GoDaddy 配置 DNS

#### 2.1 登錄 GoDaddy

1. 訪問 [godaddy.com](https://godaddy.com)
2. 點擊右上角 **Sign In** 登錄

#### 2.2 進入域名管理

1. 登錄後，點擊右上角 **My Products**
2. 在域名列表中，找到 `claritynotes.co`
3. 點擊域名旁邊的 **DNS** 按鈕
   - 或者點擊 **三個點 (⋮)** → **Manage DNS**

#### 2.3 添加 CNAME 記錄

1. 在 DNS 記錄列表中，向下滾動找到 **Records** 區域
2. 點擊 **Add** 或 **+ Add Record** 按鈕

3. 填寫以下信息：
   ```
   類型: CNAME
   名稱: app
   值: cname.vercel-dns.com
   TTL: 600 (或選擇 "1 Hour")
   ```

4. **重要提示：**
   - ✅ **名稱只填 `app`**（不要填 `app.claritynotes.co`）
   - ✅ **值填 Vercel 提供的 CNAME 值**（通常是 `cname.vercel-dns.com`）
   - ✅ GoDaddy 會自動添加域名後綴，所以記錄會顯示為 `app.claritynotes.co`

5. 點擊 **Save** 保存記錄

#### 2.4 驗證記錄已添加

添加後，你應該在 DNS 記錄列表中看到：
```
類型    名稱    值                      TTL
CNAME   app     cname.vercel-dns.com    600
```

---

### 步驟 3: 等待 DNS 傳播

1. **等待時間：** 通常 5-30 分鐘，最多 24-48 小時
2. **檢查狀態：**
   - 回到 Vercel → Settings → Domains
   - 查看 `app.claritynotes.co` 的狀態
   - 應該從 "Pending" 變為 "Valid Configuration" 或 "Ready"

---

### 步驟 4: 驗證配置

#### 方法 1: 使用命令行（推薦）

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

#### 方法 3: 直接訪問

1. 等待 10-30 分鐘後
2. 在瀏覽器中訪問 `https://app.claritynotes.co`
3. 如果看到你的應用，說明配置成功！

---

## 🎯 常見問題排查

### ❌ 問題 1: DNS 記錄添加後沒有生效

**可能原因：**
- DNS 傳播需要時間（通常 5-30 分鐘）
- 記錄配置錯誤

**解決方法：**
1. 確認記錄類型是 **CNAME**（不是 A 記錄）
2. 確認名稱只填 `app`（不是 `app.claritynotes.co`）
3. 確認值正確（從 Vercel 複製的值）
4. 清除瀏覽器緩存，使用無痕模式訪問
5. 等待更長時間（最多 1 小時）

### ❌ 問題 2: Vercel 顯示 "Invalid Configuration"

**可能原因：**
- DNS 記錄未正確添加
- DNS 值不正確

**解決方法：**
1. 在 GoDaddy 確認 CNAME 記錄已保存
2. 確認值與 Vercel 提供的完全一致
3. 使用 `dig` 或 `nslookup` 驗證 DNS 記錄
4. 如果問題持續，刪除記錄後重新添加

### ❌ 問題 3: 訪問時顯示 "This site can't be reached"

**可能原因：**
- DNS 尚未傳播
- SSL 證書尚未生成

**解決方法：**
1. 等待 10-30 分鐘讓 DNS 傳播
2. Vercel 會自動生成 SSL 證書（需要幾分鐘）
3. 確認使用 `https://` 而不是 `http://`
4. 清除瀏覽器緩存

### ❌ 問題 4: 在 GoDaddy 中找不到 "DNS" 按鈕

**可能原因：**
- 界面版本不同
- 域名管理位置不同

**解決方法：**
1. 嘗試點擊域名旁邊的 **三個點 (⋮)** → **Manage DNS**
2. 或訪問：`https://dcc.godaddy.com/manage/[your-domain]/dns`
3. 如果仍然找不到，聯繫 GoDaddy 客服

---

## 📸 GoDaddy 界面截圖說明

### 找到 DNS 管理
```
My Products → claritynotes.co → DNS (按鈕)
```

### 添加記錄界面
```
Records 區域
  ↓
+ Add Record 按鈕
  ↓
選擇類型: CNAME
  ↓
名稱: app
值: cname.vercel-dns.com
TTL: 600
  ↓
Save
```

---

## ✅ 配置完成檢查清單

- [ ] 在 Vercel 添加了 `app.claritynotes.co` 域名
- [ ] 在 GoDaddy 添加了 CNAME 記錄（名稱: `app`，值: Vercel 提供的值）
- [ ] 等待了至少 10 分鐘讓 DNS 傳播
- [ ] 使用 `dig` 或 `nslookup` 驗證 DNS 記錄
- [ ] Vercel 顯示域名狀態為 "Valid Configuration"
- [ ] 可以訪問 `https://app.claritynotes.co`
- [ ] SSL 證書已自動配置（瀏覽器顯示鎖圖標）

---

## 🚀 下一步

配置完成後，記得：

1. **更新 Supabase 配置**
   - Site URL: `https://app.claritynotes.co`
   - Redirect URLs: 添加 `https://app.claritynotes.co/auth/callback`

2. **測試登錄流程**
   - 訪問 `https://app.claritynotes.co/login`
   - 測試 Google/Apple 登錄
   - 確認重定向正常

3. **更新環境變量**（如果需要）
   - 在 Vercel 項目設置中添加環境變量

---

## 📞 需要幫助？

如果遇到問題：
1. 檢查 Vercel 的域名狀態頁面
2. 使用 DNS 檢查工具驗證記錄
3. 查看 Vercel 文檔：[Vercel DNS 配置](https://vercel.com/docs/concepts/projects/domains)
4. 查看 GoDaddy 幫助文檔：[GoDaddy DNS 管理](https://www.godaddy.com/help/manage-dns-records-680)


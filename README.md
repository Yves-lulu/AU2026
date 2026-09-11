# AU 2026 選課管理(GitHub Pages 版)

個人專用的 AU 2026 課程管理網頁:離線可用、資料永久保留、會後仍可查詢與寫心得。

## 檔案說明

| 檔案 | 用途 |
|---|---|
| `index.html` | 選課管理 App 本體(單一檔案,免安裝) |
| `catalog.json` | 課程庫:AU 官方目錄快照(App 開啟時自動載入) |
| `catalog-scraper.js` | 抓取工具:在 AU 目錄頁的瀏覽器 Console 執行,下載完整 592+173 場清單 |

## 上架 GitHub Pages(一次設定,5 分鐘)

1. 登入 GitHub → 右上「＋」→ **New repository** → 名稱如 `au2026`,設 **Public** → Create。
2. 在 repo 頁面點 **uploading an existing file**,把這三個檔案拖進去 → **Commit changes**。
3. repo 的 **Settings → Pages** → Branch 選 `main`、資料夾 `/ (root)` → **Save**。
4. 約 1 分鐘後,妳的網址就是:`https://<妳的帳號>.github.io/au2026/`
   手機、平板、電腦打開都能用,加到主畫面就像 App。

## 更新完整課程庫(出發前做一次)

1. 電腦瀏覽器開 AU 實體目錄:
   `https://conferences.autodesk.com/flow/autodesk/au2026/sessioncatalog/page/inperson`
2. 按 **F12** → **Console**,整份貼上 `catalog-scraper.js` 內容,Enter。
3. 腳本自動點完所有「Show more」(約 1–3 分鐘),完成後下載 `au2026-inperson.json`。
4. 到數位目錄頁重複一次,得到 `au2026-digital.json`。
5. 在 App 內按「📚 課程庫 → 匯入課程庫 JSON」把兩個檔各匯入一次(自動合併去重);
   或把 JSON 丟給 Claude 合併成新的 `catalog.json` 再上傳到 repo。

## 日常使用

- **貼課單**:「📚 課程庫」→ 貼上妳的課程代碼清單 → 批次比對,自動帶入時間/教室/講者。
- **衝堂**:同日時段重疊自動亮紅字;原則是實體限定優先於有 Replay 的場次。
- **現場**:點課程卡 → 改狀態「已完成」、寫心得筆記。
- **備份**:「匯出我的課表 JSON」存雲端;換裝置匯入即可。CSV 可用 Excel 開。

## 注意

- 課表資料存在「該瀏覽器」的 localStorage;GitHub 上的 `catalog.json` 是共用課程庫,
  妳的個人課表**不會**自動上傳到 GitHub(隱私安全)。要跨裝置同步,用匯出/匯入 JSON。
- AU 正式時間以官方 My Schedule 為準;目錄快照時間如有異動請以現場公告為準。

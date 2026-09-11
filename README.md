# AU 2026 中文選課管理

這是女皇專用的 AU 2026 課程管理網頁。官方完整課程庫已存入 GitHub，因此會後仍可搜尋、保存課表與整理心得。

## 現況

- 現場課程：592 堂
- 數位課程：173 堂
- 合計：765 堂（依 Autodesk 官方課程 ID 去重）
- 線上 App：https://yves-lulu.github.io/AU2026/

## 檔案

| 檔案 | 用途 |
|---|---|
| `index.html` | 中文選課管理 App |
| `catalog.json` | 完整 AU 2026 官方目錄快照，App 開啟時自動載入 |
| `catalog-scraper.js` | 必要時可在瀏覽器手動重新擷取 |
| `scripts/update-catalog.mjs` | Playwright 擷取程式 |

## 使用方式

1. 打開線上 App，按「📚 課程庫」。
2. 在「貼上妳的課單」輸入 AU My Schedule 的課程代碼，例如 `BLD1782 AS2564`。
3. 選擇「★ 必上」或「○ 備選」，按「批次比對並加入課表」。
4. 系統會自動帶入日期、時間、地點、講者，並提示時間衝突。
5. 現場可把狀態改為「已完成」並寫筆記；回程後仍能查詢。

## 資料保存

個人課表與筆記保存在該瀏覽器的 localStorage，不會公開上傳到 GitHub。換手機或電腦前，請先按「匯出我的課表 JSON」，再到另一台裝置匯入。也可匯出 CSV 給 Excel 使用。

AU 課程時間仍可能臨時異動；出發前與現場請以 Autodesk 官方 My Schedule 為準。

# 小白鞋 × 鞋帶配色人氣票選

一個純靜態的投票網站，可直接放上 **GitHub Pages**，投票結果透過 **Google Apps Script** 寫入 **Google 試算表**。

- 投票人先輸入名字 → 為 10 種鞋帶配色投票
- **女生款 3 票、男生款 3 票**（同一配色可同時投給兩款）
- 送出後結果即時寫入 Google 試算表，並可在頁面看到即時票數

```
sneaker-vote/
├─ index.html          ← 投票頁面（要改的只有最上面的 SCRIPT_URL）
├─ images/             ← 10 張配色照片（已壓縮）
├─ apps-script/
│  └─ Code.gs          ← 貼到 Google Apps Script 的後端程式
└─ README.md
```

---

## 步驟 A — 建立 Google 試算表 + Apps Script（收票用）

1. 到 [sheets.new](https://sheets.new) 建一個新的 Google 試算表，命名例如「小白鞋配色投票」。
2. 上方選單 **擴充功能 → Apps Script**，會開啟程式編輯器。
3. 把預設的 `Code.gs` 內容整個刪掉，改貼上本專案 [`apps-script/Code.gs`](apps-script/Code.gs) 的全部內容，按 💾 儲存。
4. 點右上角 **部署 → 新增部署作業**：
   - 齒輪 ⚙️ 選擇類型 → **網頁應用程式（Web app）**
   - 說明：隨意（例如 v1）
   - **執行身分：我（你自己）**
   - **具有存取權的使用者：所有人（Anyone）** ← 一定要選這個，投票才不用登入
   - 按 **部署**，第一次會要求授權，依指示允許自己的 Google 帳號。
5. 複製產生的 **網頁應用程式網址**，長得像：
   ```
   https://script.google.com/macros/s/AKfycb.....................atV/exec
   ```

> 之後若修改 `Code.gs`，要用「**部署 → 管理部署作業 → 編輯（鉛筆）→ 版本：新版本 → 部署**」才會生效。

---

## 步驟 B — 把網址填進投票頁

打開 [`index.html`](index.html)，找到最上面這一行：

```js
const SCRIPT_URL = "";
```

把剛剛複製的網址貼進去：

```js
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycb...../exec";
```

存檔即可。（留空時頁面會是「示範模式」，只測試流程、不寫入試算表。）

---

## 步驟 C — 發佈到 GitHub Pages

### 方式一：網頁上傳（最簡單，不用指令）

1. 到 [github.com/new](https://github.com/new) 建一個新的 repository（例如 `sneaker-vote`），設為 **Public**。
2. 進到 repo → **Add file → Upload files**，把 `sneaker-vote` 資料夾裡的
   `index.html`、`images/`、`apps-script/`、`README.md` **全部拖進去**上傳、Commit。
3. repo 上方 **Settings → Pages**：
   - Source 選 **Deploy from a branch**
   - Branch 選 **main** / 資料夾選 **/ (root)** → **Save**
4. 等 1～2 分鐘，頁面網址會出現在同一頁，長得像：
   ```
   https://你的帳號.github.io/sneaker-vote/
   ```
   把這個網址貼到 LINE 群組就能開始投票了 🎉

### 方式二：用 Git 指令

```bash
cd sneaker-vote
git init
git add .
git commit -m "小白鞋配色投票網站"
git branch -M main
git remote add origin https://github.com/你的帳號/sneaker-vote.git
git push -u origin main
```
再到 **Settings → Pages** 開啟（同上第 3 步）。

---

## 投票結果在哪看？

回到你的 Google 試算表，會自動出現兩個工作表：

- **投票紀錄**：每一筆投票的明細（時間、投票人、女生款/男生款選了哪些配色）
- **配色統計**：每個配色目前的 女生款票數 / 男生款票數 / 總票數（每次有人投票會自動更新）

想做長條圖：在「配色統計」選取資料 → **插入 → 圖表** 即可。

---

## 常用調整

| 想改的東西 | 改哪裡 |
|---|---|
| 每人可投幾票（目前各 3 票） | `index.html` 的 `const MAX_VOTES = 3;` |
| 配色名稱 / 說明文字 / 色票 | `index.html` 的 `COLORS` 陣列（要同步改 `Code.gs` 的 `COLOR_LIST`，**id 必須一致**） |
| 換照片 | 換掉 `images/` 裡對應的檔案（檔名不變即可） |
| 標題 / 說明 | `index.html` 的 `<header class="hero">` 區塊 |

> ⚠️ 注意：`index.html` 的每個配色 `id`（coffee、ivory…）必須和 `Code.gs` 的 `COLOR_LIST` 完全一致，統計才會對得上。

/**
 * 小白鞋 × 鞋帶配色人氣票選 — Google Apps Script 後端
 * ---------------------------------------------------------------
 * 功能：
 *   doPost() 接收前端投票 → 寫入「投票紀錄」明細 → 更新「配色統計」→ 回傳即時票數
 *   doGet()  回傳目前「配色統計」給前端顯示即時結果
 *
 * 部署方式請見 README.md（部署為「網頁應用程式」，存取權：所有人）。
 * ---------------------------------------------------------------
 */

// 10 種配色（id 必須與前端 index.html 的 COLORS 一致）
var COLOR_LIST = [
  { id: "coffee",  name: "摩卡棕" },
  { id: "ivory",   name: "米白雪紗" },
  { id: "mint",    name: "薄荷雪紗" },
  { id: "tiffany", name: "蒂芬妮藍雪紗" },
  { id: "rose",    name: "乾燥玫瑰" },
  { id: "coral",   name: "蜜桃珊瑚" },
  { id: "oat",     name: "燕麥奶茶" },
  { id: "caramel", name: "焦糖駝" },
  { id: "lemon",   name: "檸檬嫩芽" },
  { id: "sky",     name: "晴空藍" },
];

var SHEET_LOG   = "投票紀錄";  // 每筆投票明細
var SHEET_STATS = "配色統計";  // 即時票數統計

/** 前端 POST 投票 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // 避免多人同時送出造成統計錯亂
  try {
    var data = JSON.parse(e.postData.contents);

    var female = Array.isArray(data.female) ? data.female : [];
    var male   = Array.isArray(data.male)   ? data.male   : [];

    var ss  = SpreadsheetApp.getActiveSpreadsheet();
    var log = getOrCreateLogSheet(ss);

    var now = new Date();
    log.appendRow([
      now,
      String(data.name || "").slice(0, 40),
      String(data.note || "").slice(0, 60),
      female.map(idToName).join(" / "),
      male.map(idToName).join(" / "),
      female.length,
      male.length,
      String(data.ua || "").slice(0, 300)
    ]);

    // 更新統計並回傳
    var stats = recomputeStats(ss);

    return jsonOut({ ok: true, stats: stats });
  } catch (err) {
    return jsonOut({ ok: false, message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** 前端 GET 取得即時票數 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var stats = readStats(ss);
    return jsonOut({ ok: true, stats: stats });
  } catch (err) {
    return jsonOut({ ok: false, message: String(err) });
  }
}

/* ------------------------- 內部函式 ------------------------- */

function getOrCreateLogSheet(ss) {
  var sh = ss.getSheetByName(SHEET_LOG);
  if (!sh) {
    sh = ss.insertSheet(SHEET_LOG);
    sh.appendRow(["時間", "投票人", "單位/備註", "女生款選擇", "男生款選擇", "女生款票數", "男生款票數", "裝置資訊"]);
    sh.getRange(1, 1, 1, 8).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

/** 掃描所有明細，重算每個配色的女/男票數，寫入「配色統計」並回傳 */
function recomputeStats(ss) {
  var log = getOrCreateLogSheet(ss);
  var last = log.getLastRow();

  // 建立計數容器
  var count = {};
  COLOR_LIST.forEach(function (c) { count[c.id] = { id: c.id, name: c.name, female: 0, male: 0 }; });
  var nameToId = {};
  COLOR_LIST.forEach(function (c) { nameToId[c.name] = c.id; });

  if (last >= 2) {
    // D 欄=女生款選擇, E 欄=男生款選擇（以 " / " 串接的配色名稱）
    var values = log.getRange(2, 4, last - 1, 2).getValues();
    values.forEach(function (row) {
      splitNames(row[0]).forEach(function (nm) { var id = nameToId[nm]; if (id) count[id].female++; });
      splitNames(row[1]).forEach(function (nm) { var id = nameToId[nm]; if (id) count[id].male++;   });
    });
  }

  var stats = COLOR_LIST.map(function (c) { return count[c.id]; });
  writeStatsSheet(ss, stats);
  return stats;
}

function writeStatsSheet(ss, stats) {
  var sh = ss.getSheetByName(SHEET_STATS);
  if (!sh) sh = ss.insertSheet(SHEET_STATS);
  sh.clear();
  sh.appendRow(["配色", "女生款票數", "男生款票數", "總票數"]);
  sh.getRange(1, 1, 1, 4).setFontWeight("bold");
  stats.forEach(function (s) {
    sh.appendRow([s.name, s.female, s.male, s.female + s.male]);
  });
  sh.setFrozenRows(1);
}

function readStats(ss) {
  var sh = ss.getSheetByName(SHEET_STATS);
  if (!sh) return recomputeStats(ss);
  var last = sh.getLastRow();
  var nameToId = {};
  COLOR_LIST.forEach(function (c) { nameToId[c.name] = c.id; });
  var stats = COLOR_LIST.map(function (c) { return { id: c.id, name: c.name, female: 0, male: 0 }; });
  var byId = {}; stats.forEach(function (s) { byId[s.id] = s; });
  if (last >= 2) {
    var values = sh.getRange(2, 1, last - 1, 3).getValues();
    values.forEach(function (row) {
      var id = nameToId[row[0]];
      if (id && byId[id]) { byId[id].female = Number(row[1]) || 0; byId[id].male = Number(row[2]) || 0; }
    });
  }
  return stats;
}

function splitNames(s) {
  if (!s) return [];
  return String(s).split("/").map(function (x) { return x.trim(); }).filter(function (x) { return x; });
}

function idToName(id) {
  for (var i = 0; i < COLOR_LIST.length; i++) if (COLOR_LIST[i].id === id) return COLOR_LIST[i].name;
  return id;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** （選用）在編輯器手動執行一次，可初始化兩個工作表 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateLogSheet(ss);
  recomputeStats(ss);
}

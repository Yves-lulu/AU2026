/* ============================================================
   AU 2026 目錄抓取工具(在瀏覽器 Console 執行)
   使用方式:
   1. 用電腦瀏覽器開啟 AU 課程目錄頁(實體或數位皆可):
      https://conferences.autodesk.com/flow/autodesk/au2026/sessioncatalog/page/inperson
   2. 按 F12 → Console 分頁
   3. 整份貼上這個檔案的內容,按 Enter
   4. 腳本會自動一直點「Show more」直到載完全部課程(592 場約 1-3 分鐘)
   5. 完成後自動下載 au2026-inperson.json(數位頁則是 au2026-digital.json)
   6. 兩個 JSON 都抓完後,上傳到 GitHub repo(或丟給 Claude 合併成 catalog.json)
   注意:此工具只讀取妳眼前已公開顯示的網頁內容,不碰帳號與報名功能。
   ============================================================ */
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const isDigital = location.pathname.includes('/digital');
  console.log('%cAU2026 抓取開始… 頁面類型: ' + (isDigital ? 'digital' : 'inperson'), 'color:#1F3FBF;font-weight:bold');

  // 1) 自動點 Show more 直到全部載入
  let clicks = 0, guard = 0;
  while (guard++ < 300) {
    const btn = [...document.querySelectorAll('button, a, span[role="button"], div[role="button"]')]
      .find(el => /show\s*more/i.test(el.textContent || '') && el.offsetParent !== null);
    if (!btn) break;
    btn.scrollIntoView({ block: 'center' });
    btn.click();
    clicks++;
    if (clicks % 5 === 0) console.log('已點 Show more ' + clicks + ' 次,持續載入…');
    await sleep(1400); // 等待 API 回應;若網速慢可把 1400 改成 2500
  }
  console.log('載入完成(共點 ' + clicks + ' 次),開始解析…');
  await sleep(1000);

  // 2) 解析所有課程卡片
  const DAY = { 'Sep 14': '2026-09-14', 'Sep 15': '2026-09-15', 'Sep 16': '2026-09-16',
                'Sep 17': '2026-09-17', 'Sep 18': '2026-09-18', 'Sep 22': '2026-09-22', 'Sep 23': '2026-09-23' };
  const to24 = t => {
    const m = t.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i); if (!m) return '';
    let h = +m[1]; if (/PM/i.test(m[3]) && h !== 12) h += 12; if (/AM/i.test(m[3]) && h === 12) h = 0;
    return String(h).padStart(2, '0') + ':' + m[2];
  };
  const seen = {}, out = [];
  document.querySelectorAll('a[href*="/session/"]').forEach(a => {
    const url = a.href.split('?')[0];
    const label = (a.textContent || '').trim();
    if (!label || seen[url + '|' + label]) return;
    // 卡片容器:往上找含時間資訊的祖先
    let card = a, hop = 0;
    while (card.parentElement && hop++ < 8) {
      card = card.parentElement;
      if (/\d{1,2}:\d{2}\s*[AP]M\s*-\s*\d{1,2}:\d{2}\s*[AP]M/.test(card.innerText || '')) break;
    }
    const txt = card.innerText || '';
    // 代碼|標題
    let code = '', title = label;
    const mt = label.match(/^([A-Z]{2,5}\d{3,5}(?:-D)?|\d{4,5})\s*\|\s*(.+)$/);
    if (mt) { code = mt[1]; title = mt[2].trim(); }
    // 日期時間: "Tuesday, Sep 15 11:30 AM - 1:00 PM PDT"
    const md = txt.match(/(?:Mon|Tues|Wednes|Thurs|Fri)day,\s*(Sep\s*\d{1,2})\s*(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)\s*(?:PDT|PT)?/);
    const day = md ? (DAY[md[1].replace(/\s+/g, ' ')] || '') : '';
    // 地點:時間後同段文字
    let locn = '';
    if (md) {
      const after = txt.slice(txt.indexOf(md[0]) + md[0].length);
      locn = (after.split('\n').map(s => s.trim()).find(s => s && !/^\(/.test(s) && s.length < 90) || '').replace(/\(.*GMT.*\)/, '').trim();
    }
    // 類型
    const type = /hands-?on lab/i.test(txt) ? 'Hands-On Lab'
               : /keynote/i.test(txt) ? 'Keynote'
               : /meetup/i.test(txt) ? 'Meetup'
               : /technical deep dive/i.test(txt) ? 'Technical Deep Dive'
               : /strategy talk/i.test(txt) ? 'Strategy Talk'
               : /meal|breakfast|lunch(?!\s*&)/i.test(txt) ? '餐飲' : '講座';
    const enroll = /enrollment required/i.test(txt);
    // 講者:", 職稱, 公司" 前一行的人名很難精準抓,退而求其次抓 ", " 模式
    const sp = [...new Set((txt.match(/^[A-Z][\w.'-]+(?:\s[A-Z][\w.'-]+){0,3}\n,\s.+$/gm) || [])
      .map(s => s.split('\n')[0].trim()))].slice(0, 6).join('; ');
    seen[url + '|' + label] = 1;
    out.push({ code, title, day, start: md ? to24(md[2]) : '', end: md ? to24(md[3]) : '',
               location: locn, type, speakers: sp, url, delivery: isDigital ? 'digital' : 'inperson',
               enroll, replay: isDigital || undefined });
  });

  // 3) 下載 JSON
  const fname = 'au2026-' + (isDigital ? 'digital' : 'inperson') + '.json';
  const blob = new Blob([JSON.stringify({ event: 'AU 2026', scraped: new Date().toISOString(),
    page: isDigital ? 'digital' : 'inperson', count: out.length, sessions: out }, null, 1)],
    { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob); link.download = fname; link.click();
  console.log('%c完成!共抓到 ' + out.length + ' 場,已下載 ' + fname, 'color:#2E6B3F;font-weight:bold');
  console.log('把這個 JSON 用選課管理 App 的「匯入課程庫」載入,或上傳到 GitHub repo。');
})();

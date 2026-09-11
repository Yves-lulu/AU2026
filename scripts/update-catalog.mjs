import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const SOURCES = [
  { delivery: 'inperson', url: 'https://conferences.autodesk.com/flow/autodesk/au2026/sessioncatalog/page/inperson', expected: 592 },
  { delivery: 'digital', url: 'https://conferences.autodesk.com/flow/autodesk/au2026/sessioncatalog/page/digital', expected: 173 }
];

const dayMap = {
  'Monday, Sep 14': '2026-09-14',
  'Tuesday, Sep 15': '2026-09-15',
  'Wednesday, Sep 16': '2026-09-16',
  'Thursday, Sep 17': '2026-09-17',
  'Friday, Sep 18': '2026-09-18',
  'Tuesday, Sep 22': '2026-09-22',
  'Wednesday, Sep 23': '2026-09-23'
};

function to24(value = '') {
  const match = value.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
  if (!match) return '';
  let hour = Number(match[1]);
  if (/PM/i.test(match[3]) && hour !== 12) hour += 12;
  if (/AM/i.test(match[3]) && hour === 12) hour = 0;
  return String(hour).padStart(2, '0') + ':' + match[2];
}

async function loadAll(page, expected) {
  await page.waitForSelector('li.catalog-result', { timeout: 60_000 });
  let previous = 0;
  for (let step = 0; step < 80; step += 1) {
    const count = await page.locator('li.catalog-result').count();
    console.log('Loaded ' + count + ' / ' + expected);
    if (count >= expected) return count;
    const button = page.locator('button.show-more-btn:visible').last();
    if (!(await button.count())) return count;
    previous = count;
    await button.click();
    await page.waitForFunction(
      oldCount => document.querySelectorAll('li.catalog-result').length > oldCount ||
        ![...document.querySelectorAll('button.show-more-btn')].some(b => b.offsetParent !== null),
      previous,
      { timeout: 20_000 }
    ).catch(() => {});
    await page.waitForTimeout(500);
  }
  return page.locator('li.catalog-result').count();
}

async function scrape(browser, source) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  console.log('Opening ' + source.url);
  await page.goto(source.url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  const loaded = await loadAll(page, source.expected);
  if (loaded < Math.floor(source.expected * 0.95)) {
    throw new Error(source.delivery + ' catalog incomplete: ' + loaded + '/' + source.expected);
  }

  const sessions = await page.$$eval('li.catalog-result', (cards, delivery) => {
    const unique = values => [...new Set(values.filter(Boolean))];
    return cards.map(card => {
      const one = selector => card.querySelector(selector)?.textContent?.trim() || '';
      const many = selector => unique([...card.querySelectorAll(selector)].map(x => x.textContent?.trim()));
      const rawTitle = one('.custom-title-text');
      const divider = rawTitle.indexOf('|');
      const link = card.querySelector('a[href*="/session/"]');
      return {
        id: card.dataset.sessionId || '',
        code: divider >= 0 ? rawTitle.slice(0, divider).trim() : rawTitle.trim(),
        title: divider >= 0 ? rawTitle.slice(divider + 1).trim() : rawTitle.trim(),
        dayLabel: one('.session-date'),
        timeLabel: one('.session-time'),
        location: one('.session-location'),
        type: one('.badge-attribute-format') || one('.badge-attribute-sessiontype') || 'Session',
        speakers: unique([...card.querySelectorAll('.speaker-trigger')].map(x => x.textContent?.trim())).join('; '),
        tracks: many('.badge-attribute-track'),
        industries: many('.badge-attribute-industry'),
        products: many('.badge-attribute-product'),
        learningPaths: many('.badge-attribute-learningpath'),
        description: one('.description').replace(/Show more\s*$/i, '').trim(),
        url: link?.href?.split('?')[0] || '',
        delivery,
        enroll: Boolean(card.querySelector('.badge-attribute-sessionsacceptingenrollment')),
        replay: delivery === 'digital'
      };
    });
  }, source.delivery);

  await page.close();
  const seen = new Set();
  return sessions.filter(session => {
    const key = session.delivery + '|' + (session.id || session.url || session.code + '|' + session.dayLabel + '|' + session.timeLabel);
    if (seen.has(key)) return false;
    seen.add(key);
    const range = session.timeLabel.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
    session.day = dayMap[session.dayLabel] || '';
    session.start = range ? to24(range[1]) : '';
    session.end = range ? to24(range[2]) : '';
    delete session.dayLabel;
    delete session.timeLabel;
    return Boolean(session.title);
  });
}

const browser = await chromium.launch({ headless: true });
try {
  const groups = [];
  for (const source of SOURCES) groups.push(await scrape(browser, source));
  const sessions = groups.flat();
  const inperson = sessions.filter(x => x.delivery === 'inperson').length;
  const digital = sessions.filter(x => x.delivery === 'digital').length;
  const catalog = {
    event: 'Autodesk University 2026',
    updated: new Date().toISOString(),
    timezone: 'America/Los_Angeles',
    counts: { inperson, digital, total: sessions.length },
    sources: SOURCES.map(x => x.url),
    sessions
  };
  await writeFile('catalog.json', JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  console.log('Saved catalog.json: ' + inperson + ' in-person + ' + digital + ' digital');
} finally {
  await browser.close();
}

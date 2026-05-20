const fs = require('fs');
const path = require('path');
const vm = require('vm');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const DATA_JS = path.join(ROOT, 'js', 'data.js');
const OUT_DIR = path.join(ROOT, 'images', 'tinipings');
const MANIFEST_PATH = path.join(ROOT, 'data', 'tiniping_image_manifest.json');
const API_BASE = 'https://catchteenieping.fandom.com/api.php';
const FETCHED_AT = new Date().toISOString();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function requestBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'maTH-adventure-image-audit/1.0 (+https://github.com/01chungee10snu/maTH)'
      }
    }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 5) {
        res.resume();
        const nextUrl = new URL(res.headers.location, url).toString();
        requestBuffer(nextUrl, redirects + 1).then(resolve, reject);
        return;
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        resolve({
          buffer: Buffer.concat(chunks),
          contentType: res.headers['content-type'] || '',
          finalUrl: url
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error(`timeout: ${url}`));
    });
  });
}

async function requestJson(url) {
  const { buffer } = await requestBuffer(url);
  return JSON.parse(buffer.toString('utf8'));
}

function loadBaseTinipings() {
  const source = fs.readFileSync(DATA_JS, 'utf8');
  const context = {
    console,
    window: {},
    globalThis: {},
    Image: function Image() {},
    fetch: async () => ({ ok: false })
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`${source}\nglobalThis.__baseTinipings = baseTinipings;`, context);
  return context.__baseTinipings;
}

function sanitizeFileName(name) {
  return String(name || '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

function getExtension(sourceUrl, contentType) {
  const pathname = new URL(sourceUrl).pathname;
  const match = pathname.match(/\.([a-z0-9]+)(?:\/|$)/i);
  if (match) return match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('jpeg')) return 'jpg';
  if (contentType.includes('png')) return 'png';
  return 'png';
}

function getPageImageFromApiPayload(payload) {
  const pages = payload?.query?.pages || {};
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined || !page.original?.source) return null;
  return {
    title: page.title,
    sourceUrl: page.original.source,
    width: page.original.width,
    height: page.original.height
  };
}

async function queryPageImage(title) {
  const url = `${API_BASE}?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original&format=json&origin=*`;
  const payload = await requestJson(url);
  return getPageImageFromApiPayload(payload);
}

function getPageFromPayload(payload) {
  const pages = payload?.query?.pages || {};
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined) return null;
  return page;
}

async function queryPageWithImages(title) {
  const url = `${API_BASE}?action=query&titles=${encodeURIComponent(title)}&prop=images&imlimit=500&format=json&origin=*`;
  const payload = await requestJson(url);
  return getPageFromPayload(payload);
}

async function queryImageInfo(fileTitle) {
  const url = `${API_BASE}?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
  const payload = await requestJson(url);
  const page = getPageFromPayload(payload);
  const info = page?.imageinfo?.[0];
  if (!info?.url) return null;
  if (info.mime && !String(info.mime).startsWith('image/')) return null;
  return {
    title: page.title,
    sourceUrl: info.url,
    width: info.width,
    height: info.height,
    mime: info.mime
  };
}

async function searchTitle(query) {
  const url = `${API_BASE}?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=12&format=json&origin=*`;
  const payload = await requestJson(url);
  const results = payload?.query?.search || [];
  return results.map(item => item.title).filter(title => !isNonCharacterTitle(title));
}

function isNonCharacterTitle(title) {
  const text = String(title || '');
  return [
    '/Transcript',
    'Song',
    'List of',
    'Episode',
    'Teenieping 100',
    'Catch! Teenieping ×',
    'Official Poster',
    'Princess Summit',
    'Collaboration',
    'Dubs/',
    'Wiki',
    'Category:'
  ].some(pattern => text.includes(pattern));
}

function normalizeSearchText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
}

function canonicalPageTitle(title) {
  return String(title || '')
    .replace(/^File:/, '')
    .replace(/\/Gallery(?:\/.*)?$/i, '')
    .trim();
}

function isNonCharacterFile(title) {
  const text = String(title || '');
  if (!/\.(png|jpe?g|webp)$/i.test(text)) return true;
  if (!/render/i.test(text)) return true;
  return [
    ' flag',
    'Gallery page cover',
    'Official Poster',
    'Princess ',
    'Princess_',
    'QR Code',
    'Episode',
    'Logo',
    'Icon',
    'toy',
    'plush',
    'doll',
    'Group Render',
    'Magic Wand',
    "'s Box",
    "'s Cake House",
    'Prop Render',
    'Prop 2D Render',
    'Jewel Render',
    'Star Gem Render',
    'Tiara',
    'Bag Render',
    'Carriage Render'
  ].some(pattern => text.includes(pattern)) || /S\d+E\d+/i.test(text);
}

function scoreRenderFile(fileTitle, tiniping, pageTitle) {
  const text = String(fileTitle || '');
  const normalized = normalizeSearchText(text);
  const nameEn = normalizeSearchText(tiniping.nameEn);
  const page = normalizeSearchText(canonicalPageTitle(pageTitle));

  if (isNonCharacterFile(text)) return -1000;
  if (!normalized.includes(nameEn) && (!page || !normalized.includes(page))) return -1000;

  let score = 0;
  if (normalized.includes(nameEn)) score += 120;
  if (page && normalized.includes(page)) score += 80;
  if (/render/i.test(text)) score += 80;
  if (/s1 render 1/i.test(text)) score += 45;
  if (/render 1/i.test(text)) score += 35;
  if (/\.png$/i.test(text)) score += 20;
  if (/\.webp$/i.test(text)) score += 12;
  if (/2d render/i.test(text)) score += 8;
  if (/pose/i.test(text)) score -= 15;
  if (/m1/i.test(text)) score -= 20;
  if (/dwarf|monster|clone|with wings/i.test(text)) score -= 25;
  return score;
}

async function queryCharacterRenderImage(title, tiniping) {
  const page = await queryPageWithImages(title);
  const files = page?.images || [];
  if (!page || !files.length) return null;

  const ranked = files
    .map(file => ({
      title: file.title,
      score: scoreRenderFile(file.title, tiniping, page.title)
    }))
    .filter(file => file.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const candidate of ranked.slice(0, 5)) {
    const image = await queryImageInfo(candidate.title);
    if (image) {
      return {
        ...image,
        pageTitle: page.title,
        sourceFile: candidate.title,
        renderScore: candidate.score
      };
    }
    await sleep(80);
  }

  return null;
}

function titleCandidates(tiniping) {
  const candidates = [
    tiniping.nameEn,
    tiniping.nameEn?.replace(/\s+/g, ''),
    tiniping.name,
    `${tiniping.nameEn} Teenieping`,
    `${tiniping.name} 티니핑`
  ].filter(Boolean);
  return Array.from(new Set(candidates));
}

async function findImage(tiniping) {
  const koreanSearches = [
    tiniping.name,
    `${tiniping.name} 티니핑`
  ];

  for (const searchQuery of koreanSearches) {
    try {
      const titles = await searchTitle(searchQuery);
      for (const title of titles) {
        const image = await queryCharacterRenderImage(title, tiniping);
        if (image && !isNonCharacterTitle(image.pageTitle)) return { ...image, title: canonicalPageTitle(image.pageTitle), matchedBy: 'korean-render', query: searchQuery };
        await sleep(80);
      }
    } catch (error) {
      console.warn(`korean search failed: ${tiniping.name} / ${searchQuery}: ${error.message}`);
    }
  }

  for (const title of titleCandidates(tiniping)) {
    if (isNonCharacterTitle(title)) continue;
    try {
      const direct = await queryCharacterRenderImage(title, tiniping);
      if (direct && !isNonCharacterTitle(direct.pageTitle)) return { ...direct, title: canonicalPageTitle(direct.pageTitle), matchedBy: 'title-render', query: title };
    } catch (error) {
      console.warn(`direct lookup failed: ${tiniping.name} / ${title}: ${error.message}`);
    }
    await sleep(80);
  }

  const searchQueries = [
    `${tiniping.nameEn} Catch Teenieping`,
    tiniping.nameEn
  ].filter(Boolean);

  for (const searchQuery of searchQueries) {
    try {
      const titles = await searchTitle(searchQuery);
      for (const title of titles) {
        const image = await queryCharacterRenderImage(title, tiniping);
        if (image && !isNonCharacterTitle(image.pageTitle)) return { ...image, title: canonicalPageTitle(image.pageTitle), matchedBy: 'search-render', query: searchQuery };
        await sleep(80);
      }
    } catch (error) {
      console.warn(`search failed: ${tiniping.name} / ${searchQuery}: ${error.message}`);
    }
  }

  return null;
}

async function downloadImage(tiniping, imageInfo) {
  const result = await requestBuffer(imageInfo.sourceUrl);
  const ext = getExtension(imageInfo.sourceUrl, result.contentType);
  const fileName = `${sanitizeFileName(tiniping.name)}.${ext}`;
  const filePath = path.join(OUT_DIR, fileName);
  fs.writeFileSync(filePath, result.buffer);
  return {
    name: tiniping.name,
    nameEn: tiniping.nameEn,
    season: tiniping.season,
    type: tiniping.type,
    domain: tiniping.domain,
    path: `./images/tinipings/${fileName}`,
    sourceTitle: imageInfo.title,
    sourceFile: imageInfo.sourceFile,
    sourceUrl: imageInfo.sourceUrl,
    matchedBy: imageInfo.matchedBy,
    query: imageInfo.query,
    width: imageInfo.width,
    height: imageInfo.height,
    renderScore: imageInfo.renderScore,
    fetchedAt: FETCHED_AT
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

  const tinipings = loadBaseTinipings();
  const manifestItems = [];
  const missing = [];

  for (const tiniping of tinipings) {
    process.stdout.write(`[${manifestItems.length + missing.length + 1}/${tinipings.length}] ${tiniping.name} (${tiniping.nameEn}) ... `);
    const imageInfo = await findImage(tiniping);
    if (!imageInfo) {
      missing.push({ name: tiniping.name, nameEn: tiniping.nameEn });
      console.log('missing');
      continue;
    }

    try {
      const item = await downloadImage(tiniping, imageInfo);
      manifestItems.push(item);
      console.log(`ok -> ${item.path}`);
    } catch (error) {
      missing.push({ name: tiniping.name, nameEn: tiniping.nameEn, error: error.message });
      console.log(`download failed: ${error.message}`);
    }
    await sleep(120);
  }

  const manifest = {
    source: 'Catch! Teenieping Wiki / Fandom pageimages API',
    sourceApi: API_BASE,
    generatedAt: FETCHED_AT,
    itemCount: manifestItems.length,
    missingCount: missing.length,
    items: manifestItems,
    missing
  };

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`\nmanifest: ${MANIFEST_PATH}`);
  console.log(`downloaded: ${manifestItems.length}, missing: ${missing.length}`);
  if (missing.length) {
    console.log('missing names:', missing.map(item => item.name).join(', '));
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

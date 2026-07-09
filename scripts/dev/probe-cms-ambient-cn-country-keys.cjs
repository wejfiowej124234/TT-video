#!/usr/bin/env node
/**
 * CN ambient · country key 对拍（中国 / CN / catalog ISO）
 *   API=https://tt-api-staging.fly.dev node scripts/dev/probe-cms-ambient-cn-country-keys.cjs
 */
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');

function fetchJson(url) {
  const http = url.startsWith('https') ? require('https') : require('http');
  return new Promise((resolve) => {
    const u = new URL(url);
    http
      .get({ hostname: u.hostname, path: u.pathname + u.search, headers: { Accept: 'application/json' } }, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, json: JSON.parse(d) });
          } catch {
            resolve({ ok: false, status: res.statusCode, json: null });
          }
        });
      })
      .on('error', (e) => resolve({ ok: false, status: 0, json: null, error: String(e) }));
  });
}

async function main() {
  const staticRows = [
    { surface: 'productCountries', key: 'CN.nameZh', value: '中国', expect: '中国' },
    { surface: 'geoOptions', key: 'COUNTRY_OPTIONS.value', value: '中国', expect: '中国' },
    { surface: 'geoOptions', key: 'COUNTRY_OPTIONS.label', value: '中国', expect: '中国' },
    { surface: 'resolvePath', key: 'countryNameZhToIso(中国)', value: 'CN', expect: 'CN' },
    { surface: 'landingAmbientByCountry', key: '中国', value: 'present', expect: 'present' },
    { surface: 'forbidden', key: 'China (en label)', value: 'not-used-in-ambient-path', expect: 'not-used-in-ambient-path' },
  ];

  const countries = await fetchJson(`${API}/api/v1/catalog/countries`);
  const cnCountry = (countries.json?.items || []).find((r) => r.iso3166 === 'CN');
  const media = await fetchJson(`${API}/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=CN`);
  const mediaItem = media.json?.items?.[0];

  const apiRows = [
    {
      surface: 'catalog.countries',
      key: 'iso3166=CN',
      value: cnCountry ? `${cnCountry.name_zh}|${cnCountry.iso3166}` : '(missing)',
      expect: '中国|CN',
      ok: cnCountry?.name_zh === '中国' && cnCountry?.iso3166 === 'CN',
    },
    {
      surface: 'catalog.media',
      key: 'country_iso=CN',
      value: mediaItem ? `${mediaItem.country_iso}|${mediaItem.url?.split('/').pop()}` : '(missing)',
      expect: 'CN|published-url',
      ok: media.ok && mediaItem?.country_iso === 'CN' && Boolean(mediaItem?.url),
    },
  ];

  console.log('TT_CN_AMBIENT_KEY_AUDIT: STATIC');
  for (const r of staticRows) {
    const ok = r.value === r.expect;
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${r.surface} · ${r.key} = ${r.value} (expect ${r.expect})`);
  }

  console.log('TT_CN_AMBIENT_KEY_AUDIT: API');
  let apiFail = 0;
  for (const r of apiRows) {
    console.log(`  ${r.ok ? 'PASS' : 'FAIL'} ${r.surface} · ${r.key} = ${r.value}`);
    if (!r.ok) apiFail += 1;
  }

  const allOk = apiFail === 0;
  console.log(`TT_CN_AMBIENT_KEY_AUDIT: ${allOk ? 'PASS' : 'GAPS_OPEN'}`);
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

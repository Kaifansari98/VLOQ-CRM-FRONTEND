const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const moduleUnderTest = { exports: {} };
new Function('exports', ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/metal-cutlist-parser.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(moduleUnderTest.exports);
const { parseMetalPartInfo } = moduleUnderTest.exports;
const fixture = require('./fixtures/metal-part-info.json');
test('extracts all 21 Part Info rows across continuation pages with exact dimensions and 56 pieces', () => {
  const result = parseMetalPartInfo(fixture);
  assert.equal(result.parts.length, 21);
  assert.equal(result.parts.reduce((sum, row) => sum + row.partsCount, 0), 56);
  assert.deepEqual(result.warnings, []);
  assert.deepEqual(result.parts.map(row => row.order), Array.from({ length: 21 }, (_, i) => i + 1));
  assert.equal(result.parts[0].partName, 'bdf500');
  assert.equal(result.parts[7].partName, 'mbp1000500-rd-wr-hf');
  assert.equal(result.parts[7].dimension1Mm, 547.54);
  assert.equal(result.parts[7].dimension2Mm, 1047.43);
  assert.equal(result.parts.at(-1).partName, 'skd501000');
  assert.equal(result.parts.at(-1).page, 3);
  assert.ok(result.parts.every(row => row.nestCount === row.partsCount && row.remainCount === 0 && row.processed === 0));
  assert.ok(result.parts.every(row => row.thumbnailBounds.width > 0 && row.thumbnailBounds.height > 0));
});
test('handles shuffled PDF text emission without relying on extraction order', () => {
  const shuffled = fixture.map(page => ({ ...page, items: [...page.items].reverse() }));
  assert.deepEqual(parseMetalPartInfo(shuffled), parseMetalPartInfo(fixture));
});
test('excludes Plate Info and repeated nesting parts lists', () => {
  const other = { ...fixture[0], page: 1, items: fixture[0].items.filter(item => !['Part Info', 'Nest Count', 'Remain Count', 'Processed'].includes(item.str)) };
  assert.equal(parseMetalPartInfo([other, ...fixture, { ...other, page: 5 }]).parts.length, 21);
});
test('flags malformed rows rather than inventing missing counts', () => {
  const pages = structuredClone(fixture);
  pages[0].items = pages[0].items.filter(item => !(item.x > 500 && item.y === 132.5));
  const result = parseMetalPartInfo(pages);
  assert.equal(result.parts.length, 20);
  assert.match(result.warnings[0], /Page 2, row 1/);
});
test('reports missing Part Info headers and rejects scanned/unrelated PDFs', () => {
  assert.throws(() => parseMetalPartInfo([{ page: 1, width: 600, height: 800, items: [] }]), /No readable Part Info/);
  assert.throws(() => parseMetalPartInfo([fixture[1]]), /No readable Part Info/);
});

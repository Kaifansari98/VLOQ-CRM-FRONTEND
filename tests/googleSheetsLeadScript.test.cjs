const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
const moduleExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/googleSheetsLeadScript.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: moduleExports });

function fixture(data = [['Name', 'Phone', 'Email', 'Requirement'], ['Alice', '9876543210', 'a@example.com', 'Kitchen']]) {
  const state = { data, requests: [], properties: {}, triggers: [], locked: false, response: { code: 200, body: { success: true, lead: { id: 1 } } } };
  const sheet = {
    getSheetId: () => 1, getName: () => 'Meta leads', getLastColumn: () => state.data[0].length,
    getLastRow: () => state.data.length, getMaxColumns: () => 100,
    getRange(row, col, height = 1, width = 1) {
      return {
        getDisplayValues: () => Array.from({ length: height }, (_, r) => Array.from({ length: width }, (_, c) => String(state.data[row + r - 1]?.[col + c - 1] ?? ''))),
        setValue(value) { state.data[row - 1][col - 1] = value; },
      };
    },
  };
  const spreadsheet = { getId: () => 'spreadsheet', getName: () => 'October Campaign', getActiveSheet: () => sheet, getSheets: () => [sheet] };
  const context = {
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, openById: () => spreadsheet, flush() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => state.properties[key], setProperty: (k, v) => { state.properties[k] = v; }, setProperties: values => Object.assign(state.properties, values) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => { if (state.locked) return false; state.locked = true; return true; }, releaseLock: () => { state.locked = false; } }) },
    ScriptApp: {
      getProjectTriggers: () => [...state.triggers], deleteTrigger: trigger => { state.triggers = state.triggers.filter(t => t !== trigger); },
      newTrigger(name) {
        const builder = { timeBased() { return this; }, everyMinutes(n) { assert.equal(n, 1); return this; }, forSpreadsheet() { return this; }, onEdit() { return this; }, create() { state.triggers.push({ getHandlerFunction: () => name }); } };
        return builder;
      },
    },
    Logger: { log() {} },
    Utilities: { DigestAlgorithm: { SHA_256: 'sha256' }, computeDigest: (algo, data) => crypto.createHash(algo).update(data).digest(), base64Encode: data => Buffer.from(data).toString('base64') },
    UrlFetchApp: { fetch(url, options) {
      state.requests.push({ url, payload: JSON.parse(options.payload) });
      if (state.response instanceof Error) throw state.response;
      return { getResponseCode: () => state.response.code, getContentText: () => typeof state.response.body === 'string' ? state.response.body : JSON.stringify(state.response.body) };
    } },
  };
  vm.createContext(context);
  vm.runInContext(moduleExports.buildGoogleSheetsLeadScript('https://example.test/webhook?vendor_token=test'), context);
  state.context = context;
  state.edit = (row, lastRow = row, tabId = 1) => context.sendLeadToCRM({ source: spreadsheet, range: { getSheet: () => ({ getSheetId: () => tabId }), getRow: () => row, getLastRow: () => lastRow } });
  state.cell = (row, name) => state.data[row - 1][state.data[0].indexOf(name)];
  context.setupCRMSync();
  return state;
}

test('scheduled sync picks up API-inserted rows without edit events and skips acknowledged rows', () => {
  const f = fixture();
  f.context.syncPendingLeads();
  assert.equal(f.cell(2, 'CRM Sync Status'), 'Synced');
  assert.equal(f.requests[0].payload.source, 'October Campaign');
  assert.equal(f.requests[0].payload.Requirement, 'Kitchen');
  assert.ok(!Object.keys(f.requests[0].payload).some(k => k.startsWith('CRM ')));
  f.context.syncPendingLeads();
  assert.equal(f.requests.length, 1);
  f.data.push(['Bob', '9876543211']);
  f.context.syncPendingLeads();
  assert.equal(f.requests.length, 2);
});

test('multirow pastes, changed rows, and partial rows', () => {
  const f = fixture([['Full Name', 'Phone Number'], ['A', '9876543210'], ['B', '9876543211'], ['C', '']]);
  f.edit(1, 4);
  assert.equal(f.requests.length, 2);
  assert.equal(f.cell(4, 'CRM Sync Status'), 'Waiting for name/phone');
  f.data[3][1] = '9876543212';
  f.data[1][0] = 'Changed';
  f.context.syncPendingLeads();
  assert.equal(f.requests.length, 4);
  assert.equal(f.cell(4, 'CRM Sync Status'), 'Synced');
});

test('only a successful lead acknowledgement marks a row synced; failures retry', () => {
  for (const response of [
    { code: 500, body: { success: false, error: 'Failed' } },
    { code: 200, body: { success: true } },
    { code: 200, body: { success: false, lead: { id: 1 } } },
    { code: 200, body: '<html>Proxy</html>' },
    new Error('Network unavailable'),
  ]) {
    const f = fixture(); f.response = response; f.context.syncPendingLeads();
    assert.equal(f.cell(2, 'CRM Sync Status'), 'Retry');
    assert.ok(!f.cell(2, 'CRM Sync Hash'));
    f.response = { code: 200, body: { success: true, lead: { id: 1 } } };
    f.context.syncPendingLeads();
    assert.equal(f.cell(2, 'CRM Sync Status'), 'Synced');
    assert.equal(f.cell(2, 'CRM Sync Error'), '');
  }
});

test('repeated setup creates no duplicate triggers or columns and preserves unrelated triggers', () => {
  const f = fixture();
  f.triggers.push({ getHandlerFunction: () => 'unrelated' });
  const width = f.data[0].length;
  f.context.setupCRMSync();
  assert.equal(f.triggers.length, 3);
  assert.equal(f.data[0].length, width);
});

test('shared lock prevents overlap and edits on unrelated tabs are ignored', () => {
  const f = fixture(); f.locked = true; f.context.syncPendingLeads(); assert.equal(f.requests.length, 0);
  f.locked = false; f.edit(2, 2, 99); assert.equal(f.requests.length, 0);
  f.context.syncPendingLeads(); assert.equal(f.requests.length, 1); assert.equal(f.locked, false);
});

test('batch cursor moves past failing rows and eventually retries them', () => {
  const f = fixture([['Name', 'Phone'], ...Array.from({ length: 55 }, (_, i) => ['Lead ' + i, '9876543210'])]);
  f.response = { code: 503, body: { success: false } };
  f.context.syncPendingLeads(); assert.equal(f.requests.length, 50);
  assert.equal(f.properties.CRM_NEXT_ROW, '52');
  f.context.syncPendingLeads(); assert.equal(f.requests[50].payload.name, 'Lead 50');
  assert.equal(f.requests[55].payload.name, 'Lead 0');
});

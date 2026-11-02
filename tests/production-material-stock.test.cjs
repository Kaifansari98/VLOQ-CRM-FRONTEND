const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/components/production/order-login-stage/ProductionMaterialsTable.tsx'), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const service = { exports: {} };
vm.runInNewContext(code, { exports: service.exports, require: () => ({}) });
const { getMaterialStockState } = service.exports;
const row = (extra = {}) => ({ qty: 10, available: 20, status: 'ready', ...extra });

test('classifies covered, insufficient and zero stock into distinct filters', () => {
  assert.equal(getMaterialStockState(row()), 'ready');
  assert.equal(getMaterialStockState(row({ available: 10 })), 'ready');
  assert.equal(getMaterialStockState(row({ available: 4, status: 'shortage' })), 'low');
  assert.equal(getMaterialStockState(row({ available: 0, status: 'shortage' })), 'zero');
  assert.equal(getMaterialStockState(row({ available: -1, status: 'shortage' })), 'zero');
});

test('low stock uses the minimum threshold after meeting the requirement', () => {
  assert.equal(getMaterialStockState(row({ available: 14, product: { min_stock_qty: '5' } })), 'low');
  assert.equal(getMaterialStockState(row({ available: 15, product: { min_stock_qty: 5 } })), 'ready');
  for (const minimum of [undefined, null, '', 'invalid']) {
    assert.equal(getMaterialStockState(row({ product: { min_stock_qty: minimum } })), 'ready');
  }
  assert.equal(getMaterialStockState(row({ qty: 0.2, available: 0.3, product: { min_stock_qty: 0.1 } })), 'ready');
});

test('unverifiable inventory stays unavailable rather than zero stock', () => {
  for (const status of ['invalid', 'unmatched', 'ambiguous', 'inactive', 'unknown']) {
    assert.equal(getMaterialStockState(row({ status, available: 0 })), 'unavailable');
  }
  for (const available of [undefined, NaN, Infinity]) {
    assert.equal(getMaterialStockState(row({ available })), 'unavailable');
  }
});

test('reserved and issued quantities reduce the remaining stock requirement without double counting', () => {
  assert.equal(getMaterialStockState(row({ available: 5, frozenQty: 6 })), 'ready');
  assert.equal(getMaterialStockState(row({ available: 5, issuedQty: 6 })), 'ready');
  assert.equal(getMaterialStockState(row({ available: 3, frozenQty: 6, issuedQty: 5 })), 'low');
  assert.equal(getMaterialStockState(row({ available: 0, frozenQty: 10 })), 'ready');
  assert.equal(getMaterialStockState(row({ available: 0, issuedQty: 10 })), 'ready');
});

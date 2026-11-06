const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/lib/global-lead-search.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exportsObject = {};
new Function('exports', compiled)(exportsObject);
const { getLeadSearchItems: items, getLeadSearchDetailsPath: detailsPath } = exportsObject;
const lead = (instances) => ({
  id: 42, account_id: 7, name: 'Example Client', lead_code: 'CRM-42',
  productStructureInstances: instances,
});
const instance = (id, quantity, tech, order) => ({
  id, quantity_index: quantity,
  is_tech_check_completed: tech, is_order_login_completed: order,
});

test('Type 8/9/10 search uses the same completion boundaries as the table', () => {
  const data = [lead([
    instance(1, 1, null, null), instance(2, 2, false, true),
    instance(3, 3, true, null), instance(4, 4, true, false),
    instance(5, 5, true, true),
  ])];
  assert.deepEqual(items('techCheckStage', data, false).map(row => row.instance_id), [1, 2]);
  assert.deepEqual(items('orderLoginStage', data, false).map(row => row.instance_id), [3, 4]);
  assert.deepEqual(items('productionStage', data, false).map(row => row.instance_id), [5]);
});

test('a single eligible instance retains its original quantity suffix among multiple instances', () => {
  const data = [lead([instance(11, 1, false, false), instance(12, 4, true, false)])];
  const [row] = items('orderLoginStage', data, false);
  assert.equal(row.lead_code, 'CRM-42.4');
  assert.equal(row.instance_id, 12);
  assert.equal(data[0].lead_code, 'CRM-42');
});

test('a lead with only one instance has no suffix but still links to that instance', () => {
  const [row] = items('productionStage', [lead([instance(55, 1, true, true)])], false);
  assert.equal(row.lead_code, 'CRM-42');
  assert.equal(row.instance_id, 55);
});

test('instance titles and structure labels distinguish results with equal quantity indexes', () => {
  const data = [lead([
    { ...instance(11, 1, false, false), title: 'Kitchen' },
    { ...instance(12, 1, false, false), title: '', productStructure: { type: 'Wardrobe' } },
  ])];
  const rows = items('techCheckStage', data, false);
  assert.deepEqual(rows.map(row => row.instance_label), ['Kitchen', 'Wardrobe']);
  assert.notEqual(detailsPath('/details', 'techCheckStage', rows[0]), detailsPath('/details', 'techCheckStage', rows[1]));
});

test('large-scale vendors and other stages retain lead-wise results', () => {
  const data = [lead([instance(1, 1, false, false), instance(2, 2, true, true)])];
  for (const stage of ['techCheckStage', 'orderLoginStage', 'productionStage']) {
    assert.equal(items(stage, data, true), data);
  }
  assert.equal(items('openStage', data, false), data);
  assert.equal(items('readyToDispatchStage', data, false), data);
});

test('instance-driven stages omit leads without an eligible instance, matching the table', () => {
  assert.deepEqual(items('techCheckStage', [lead([])], false), []);
  assert.deepEqual(items('orderLoginStage', [lead([instance(1, 1, false, false)])], false), []);
});

test('details routes preserve accountId and add the selected instance_id in all three stages', () => {
  for (const stage of ['techCheckStage', 'orderLoginStage', 'productionStage']) {
    const url = new URL(detailsPath('/details', stage, { ...lead([]), instance_id: 55 }), 'https://crm.test');
    assert.equal(url.pathname, '/details/42');
    assert.equal(url.searchParams.get('accountId'), '7');
    assert.equal(url.searchParams.get('instance_id'), '55');
  }
});

test('ordinary lead and completed-project navigation preserve their existing parameters', () => {
  assert.equal(detailsPath('/details', 'openStage', lead([])), '/details/42?accountId=7');
  assert.equal(detailsPath('/details', 'projectCompletedStage', lead([])), '/details/42?accountId=7&tab=servicing&source=servicing');
});

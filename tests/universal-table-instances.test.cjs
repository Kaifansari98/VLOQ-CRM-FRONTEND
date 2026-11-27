const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/components/custom/UniversalTable.tsx'), 'utf8');
const file = ts.createSourceFile('table.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'tableData') callback = node.initializer.arguments[0].getText(file);
  ts.forEachChild(node, visit);
}
visit(file);
const compiled = ts.transpileModule(`const build = ${callback};`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
function rows(stage, large, leads) {
  const scope = {
    normalizedType: stage.toLowerCase(), type: stage, handlesLargeScaleProjectsFromAuth: large,
    activeSorting: [], activeData: leads, isOnlineLeadFeatureEnabled: false,
    showServicingColumn: false, pendingServicesOnly: false, servicingMonthFilter: null,
    productionStatusFilter: 'all', STATUS_LOG_SORTED_STAGE_TYPES: new Set(),
    mapUniversalRow: (lead, index, options) => ({ id: lead.id, ...options }),
    prioritizeFastProductionRows: rows => rows,
    compareTechCheckCompletedAtDesc: () => 0, compareOrderLoginCompletedAtDesc: () => 0,
    getProductionStatusFromInstance: () => 'Completed',
  };
  return new Function(...Object.keys(scope), `${compiled}\nreturn build();`)(...Object.values(scope));
}
const instance = (id, overrides = {}) => ({ id, quantity_index: id, is_tech_check_completed: true, is_order_login_completed: true, ...overrides });
const lead = (id, instances, large = false) => ({ id, productStructureInstances: instances, createdBy: { vendor: { handlesLargeScaleProjects: large } } });
test('large-scale downstream stages expand each non-archived instance', () => {
  for (let stage = 11; stage <= 17; stage++) {
    const result = rows(`Type ${stage}`, true, [lead(1, [instance(10), instance(20), instance(30, { is_archived: true })])]);
    assert.deepEqual(result.map(row => row.instanceId), [10, 20]);
    assert.deepEqual(result.map(row => row.rowKey), ['1-10', '1-20']);
  }
});
test('other vendors stay grouped in every downstream stage', () => {
  for (let stage = 11; stage <= 17; stage++) assert.equal(rows(`Type ${stage}`, false, [lead(1, [instance(10), instance(20)])]).length, 1);
});
test('mixed-vendor rows only expand the large-scale lead', () => {
  const result = rows('Type 12', false, [lead(1, [instance(10), instance(20)], true), lead(2, [instance(30), instance(40)])]);
  assert.deepEqual(result.map(row => row.instanceId), [10, 20, undefined]);
});
test('Type 8 stays grouped and Types 9/10 preserve eligibility', () => {
  const data = [lead(1, [instance(10, { is_tech_check_completed: false }), instance(20, { is_order_login_completed: false }), instance(30)])];
  assert.equal(rows('Type 8', true, data).length, 1);
  assert.deepEqual(rows('Type 9', true, data).map(row => row.instanceId), [20]);
  assert.deepEqual(rows('Type 10', true, data).map(row => row.instanceId), [30]);
});
test('legacy leads without instances stay accessible; archived-only leads have no eligible rows', () => {
  assert.equal(rows('Type 11', true, [lead(1, [])]).length, 1);
  assert.equal(rows('Type 11', true, [lead(1, [instance(10, { is_archived: true })])]).length, 0);
});

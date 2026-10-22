const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const moduleUnderTest = { exports: {} };
new Function('exports', ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/sheet-formula.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(moduleUnderTest.exports);
const { evaluateSheet, toStoredFormula, toDisplayFormula, validateFormula, referencedCells } = moduleUnderTest.exports;

const sheet = (...cells) => cells.map((cell, index) => ({ id: index + 1, code: `r${index + 1}`, amount: '', ...cell }));
const valueOf = (rows, id) => evaluateSheet(rows).get(id);

test('evaluates the capacity example: sheets/shift and cuts/hour chains', () => {
  const rows = sheet({ amount: '6' }, { amount: '8' }, { formula: '=[r1]*[r2]' }, { amount: '15' }, { formula: '=[r4]*[r1]' }, { formula: '=[r5]*[r2]' });
  assert.deepEqual(valueOf(rows, 3), { value: 48 });
  assert.deepEqual(valueOf(rows, 5), { value: 90 });
  assert.deepEqual(valueOf(rows, 6), { value: 720 });
});

test('supports precedence, brackets, unary minus, power, percent and functions with ranges', () => {
  const rows = sheet({ amount: '2' }, { amount: '3' }, { amount: '4' }, { formula: '=[r1]+[r2]*[r3]' }, { formula: '=([r1]+[r2])*[r3]' }, { formula: '=-[r1]^2' }, { formula: '=SUM([r1]:[r3])/3' }, { formula: '=ROUND(10/3, 2)' }, { formula: '=[r3]*50%' }, { formula: '=max([r1]:[r3])-min([r3]:[r1])' });
  const values = evaluateSheet(rows);
  assert.equal(values.get(4).value, 14);
  assert.equal(values.get(5).value, 20);
  assert.equal(values.get(6).value, 4);
  assert.equal(values.get(7).value, 3);
  assert.equal(values.get(8).value, 3.33);
  assert.equal(values.get(9).value, 2);
  assert.equal(values.get(10).value, 2);
});

test('treats blank cells as 0 and trims floating point noise', () => {
  const rows = sheet({ amount: '0.1' }, { amount: '0.2' }, { amount: '' }, { formula: '=[r1]+[r2]+[r3]' });
  assert.equal(valueOf(rows, 4).value, 0.3);
});

test('reports Excel-style errors', () => {
  const rows = sheet({ amount: '0' }, { formula: '=10/[r1]' }, { formula: '=[missing]*2' }, { formula: '=[r5]+1' }, { formula: '=[r4]+1' }, { formula: '=FOO(1)' }, { formula: '=1+' }, { formula: '=[r2]*2' });
  const values = evaluateSheet(rows);
  assert.equal(values.get(2).error, '#DIV/0!');
  assert.equal(values.get(3).error, '#REF!');
  assert.equal(values.get(4).error, '#CIRC!');
  assert.equal(values.get(6).error, '#NAME?');
  assert.equal(values.get(7).error, '#ERROR!');
  assert.equal(values.get(8).error, '#DIV/0!', 'errors propagate to dependent cells');
  assert.equal(validateFormula('=1+'), '#ERROR!');
  assert.equal(validateFormula('=SUM([r1]:[r2])'), null);
});

test('converts between typed B-references and stored row codes', () => {
  const book = (rows) => [{ title: 'Sheet', rows }];
  const rows = sheet({}, {}, {});
  assert.equal(toStoredFormula('=B2*b1', book(rows), 0), '=[r2]*[r1]');
  assert.equal(toStoredFormula('=SUM(B1:B3)/ABS(-B3)', book(rows), 0), '=SUM([r1]:[r3])/ABS(-[r3])');
  assert.equal(toStoredFormula('=$B$1+B9', book(rows), 0), '=[r1]+[#REF!]');
  assert.equal(toDisplayFormula('=[r2]*[r1]', book(rows), 0), '=B2*B1');
  assert.equal(toDisplayFormula('=SUM([r1]:[r3])', book(rows), 0), '=SUM(B1:B3)');
  // After row 1 is deleted the same stored formula follows the rows that moved and flags the missing one.
  assert.equal(toDisplayFormula('=[r2]*[r1]', book(rows.slice(1)), 0), '=B1*#REF!');
  assert.equal(toStoredFormula(toDisplayFormula('=[r2]*[r1]', book(rows.slice(1)), 0), book(rows.slice(1)), 0), '=[r2]*[#REF!]');
});

test('references across sheets: typing, display, evaluation and highlighting', () => {
  const cost = [{ id: 1, code: 'c1', amount: '100', group: 'cost' }, { id: 2, code: 'c2', amount: '50', group: 'cost' }, { id: 3, code: 'ctotal', amount: '', formula: '=SUM([c1]:[c2])', group: 'cost' }];
  const maint = [{ id: 4, code: 'amc', amount: '10', group: 'maint' }, { id: 5, code: 'pct', amount: '0.05', group: 'maint' }];
  const workbook = [{ title: 'Machine Cost', rows: cost }, { title: 'Machine Maintenance', rows: maint }];
  const stored = toStoredFormula("=(Machine Cost.B3*B2)+'machine cost'!B1+SUM(Machine Cost.B1:B2)", workbook, 1);
  assert.equal(stored, '=([ctotal]*[pct])+[c1]+SUM([c1]:[c2])');
  assert.equal(toDisplayFormula(stored, workbook, 1), '=(Machine Cost.B3*B2)+Machine Cost.B1+SUM(Machine Cost.B1:B2)');
  assert.equal(toDisplayFormula(stored, workbook, 0), '=(B3*Machine Maintenance.B2)+B1+SUM(B1:B2)');
  const values = evaluateSheet([...cost, ...maint, { id: 6, code: 'total', amount: '', formula: stored, group: 'maint' }, { id: 7, code: 'bad', amount: '', formula: '=SUM([c2]:[amc])', group: 'maint' }]);
  assert.equal(values.get(6).value, 150 * 0.05 + 100 + 150);
  assert.equal(values.get(7).error, '#REF!', 'a range cannot span sheets');
  assert.deepEqual(referencedCells('=Machine Cost.B1:B2*B2', workbook, 1), [{ sheetIndex: 0, rowIndex: 0 }, { sheetIndex: 0, rowIndex: 1 }, { sheetIndex: 1, rowIndex: 1 }]);
});

test('text cells: arithmetic gives #VALUE!, functions skip them', () => {
  const rows = sheet({ text: '300x300' }, { amount: '4' }, { formula: '=[r1]*2' }, { formula: '=SUM([r1]:[r2])' }, { formula: '=SUM([r1],[r2])+1' }, { formula: '=[r3]+1' }, { text: 'NA' }, { formula: '=MAX([r7])' });
  const values = evaluateSheet(rows);
  assert.deepEqual(values.get(1), { value: 0, text: '300x300' });
  assert.equal(values.get(3).error, '#VALUE!');
  assert.equal(values.get(4).value, 4);
  assert.equal(values.get(5).value, 5);
  assert.equal(values.get(6).error, '#VALUE!', 'the error propagates');
  assert.equal(values.get(8).value, 0);
});

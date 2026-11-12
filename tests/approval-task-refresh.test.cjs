const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

for (const [file, hook] of [
  ['hooks/Site-measruement/useSiteMeasruementLeadsQueries.ts', 'useCompletedUpdateTask'],
  ['hooks/useSelfAssignTaskActions.ts', 'useUpdateSelfAssignTask'],
]) {
  test(`${hook} refreshes the same lead's approval state and pending tasks after completion`, () => {
    const invalidations = [];
    const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const exports = {};
    vm.runInNewContext(code, { exports, require: name => name === '@tanstack/react-query'
      ? { useMutation: options => options, useQueryClient: () => ({ invalidateQueries: options => invalidations.push(options) }) }
      : {} });
    const mutation = exports[hook]();
    mutation.onSuccess({}, { leadId: 7 });
    assert.equal(invalidations.length, 2);
    assert.equal(invalidations[0].queryKey[0], 'leadSuperAdminApprovalLockIns');
    assert.equal(invalidations[1].queryKey[0], 'activeLeadTasks');
    for (const invalidation of invalidations) {
      assert.equal(invalidation.predicate({ queryKey: [invalidation.queryKey[0], 1, 7, 'dispatch_planning'] }), true);
      assert.equal(invalidation.predicate({ queryKey: [invalidation.queryKey[0], 1, 8, 'dispatch_planning'] }), false);
    }
  });
}

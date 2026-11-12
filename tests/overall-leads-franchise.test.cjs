const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.join(__dirname, "../src");
function evaluate(source, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(code, { exports, ...globals });
  return exports;
}
function memoBody(name) {
  const ast = ts.createSourceFile(
    "UniversalTable.tsx",
    fs.readFileSync(
      path.join(root, "components/custom/UniversalTable.tsx"),
      "utf8",
    ),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let found;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name)
      found = node.initializer.arguments[0].getText(ast);
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(found);
  return `exports.run = ${found};`;
}
function payloadContext(extra = {}) {
  return {
    userId: 7,
    userType: "admin",
    isAdmin: true,
    isAdminOverallLeads: true,
    assignedFranchiseId: 10,
    isCaller: false,
    allVendorLeads: false,
    franchiseId: 20,
    shouldIncludeFranchise: true,
    ignoreFranchiseScope: false,
    type: "ALL",
    strictStatusTag: false,
    materialIssueReadyOnly: false,
    materialIssueCompletedOnly: false,
    myPagination: { pageIndex: 0, pageSize: 10 },
    overallPagination: { pageIndex: 0, pageSize: 10 },
    mySorting: [],
    overallSorting: [],
    myColumnFilters: [],
    overallColumnFilters: [],
    myGlobalFilter: "",
    overallGlobalFilter: "",
    myFranchisesFilter: [20],
    overallFranchisesFilter: [20],
    productionStatusFilter: "all",
    pendingServicesOnly: false,
    servicingDateRange: undefined,
    mapTableFiltersToPayload: () => ({}),
    ...extra,
  };
}
for (const name of ["overallPostPayload", "myPostPayload"]) {
  test(`${name} uses the admin's attached franchise instead of the selected store`, () => {
    const payload = evaluate(memoBody(name), payloadContext()).run();
    assert.equal(payload.franchise_id, 10);
    assert.deepEqual(Array.from(payload.franchises), [10]);
    assert.equal(payload.userId, 7);
  });
  test(`${name} keeps the selected franchise behavior for Super Admin`, () => {
    const payload = evaluate(
      memoBody(name),
      payloadContext({ userType: "super-admin", isAdminOverallLeads: false }),
    ).run();
    assert.equal(payload.franchise_id, 20);
  });
}
test("head-office admin cannot select another franchise on Overall Leads", () => {
  const run = evaluate(memoBody("showFranchiseFilter"), {
    isAdminOverallLeads: true,
    ignoreFranchiseScope: false,
    isHOUser: true,
    userType: "admin",
  }).run;
  assert.equal(run(), false);
});
test("Sales Executive header forwards table metadata to its franchise-scoped filter", () => {
  const ast = ts.createSourceFile(
    "columns.tsx",
    fs.readFileSync(
      path.join(root, "components/utils/column/Universal-column.tsx"),
      "utf8",
    ),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let header;
  const visit = (node) => {
    if (
      ts.isObjectLiteralExpression(node) &&
      node.properties.some(
        (p) =>
          ts.isPropertyAssignment(p) &&
          p.name.getText(ast) === "accessorKey" &&
          p.initializer.text === "sales_executive",
      )
    )
      header = node.properties
        .find(
          (p) => ts.isPropertyAssignment(p) && p.name.getText(ast) === "header",
        )
        .initializer.getText(ast);
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(header);
  const table = { options: { meta: { adminOverallFranchiseScope: true } } };
  const result = evaluate(`exports.run=${header}`, {
    DataTableColumnHeader: "Header",
    require: () => ({ jsx: (type, props) => ({ type, props }) }),
  }).run({ column: {}, table });
  assert.equal(result.props.table, table);
});
function executiveFilter({
  role = "admin",
  assigned = 10,
  selected = 20,
  scoped = true,
} = {}) {
  const calls = [];
  const state = {
    auth: {
      user: {
        vendor_id: 1,
        franchise_id: assigned,
        user_type: { user_type: role },
      },
      franchise_id: selected,
    },
  };
  const exports = evaluate(
    fs.readFileSync(
      path.join(root, "components/data-table/sales-executive-filter.tsx"),
      "utf8",
    ),
    {
      require: (name) => {
        if (name === "react") return { useMemo: (fn) => fn() };
        if (name === "react/jsx-runtime")
          return {
            jsx: (type, props) => ({ type, props }),
            jsxs: (type, props) => ({ type, props }),
          };
        if (name === "@/redux/store")
          return { useAppSelector: (fn) => fn(state) };
        if (name === "@/hooks/useVendorSalesExecutiveUsers")
          return {
            useVendorSalesExecutiveUsers: (...args) => {
              calls.push(args);
              return {
                data: { data: { sales_executives: [] } },
                isLoading: false,
              };
            },
          };
        return {};
      },
    },
  );
  exports.default({
    column: { getFilterValue: () => [] },
    table: { options: { meta: { adminOverallFranchiseScope: scoped } } },
  });
  return calls[0];
}
test("executive filter requests the attached franchise in strict mode for admin Overall Leads", () => {
  const [vendor, franchise, options, enabled] = executiveFilter();
  assert.equal(vendor, 1);
  assert.equal(franchise, 10);
  assert.equal(options.strictFranchise, true);
  assert.equal(enabled, true);
});
test("executive filter never requests the whole vendor when an admin has no franchise", () => {
  const [, franchise, , enabled] = executiveFilter({ assigned: null });
  assert.equal(franchise, undefined);
  assert.equal(enabled, false);
});
test("Super Admin retains selected-store options", () => {
  const [, franchise, options, enabled] = executiveFilter({
    role: "super-admin",
  });
  assert.equal(franchise, 20);
  assert.equal(options, undefined);
  assert.equal(enabled, true);
});
test("executive query honors the disabled state and separates franchise caches", () => {
  const api = evaluate(
    fs.readFileSync(
      path.join(root, "hooks/useVendorSalesExecutiveUsers.ts"),
      "utf8",
    ),
    {
      require: (name) =>
        name === "@tanstack/react-query"
          ? { useQuery: (options) => options }
          : {},
    },
  );
  const missing = api.useVendorSalesExecutiveUsers(
    1,
    undefined,
    { strictFranchise: true },
    false,
  );
  const assigned = api.useVendorSalesExecutiveUsers(
    1,
    10,
    { strictFranchise: true },
    true,
  );
  assert.equal(missing.enabled, false);
  assert.equal(assigned.enabled, true);
  assert.equal(assigned.queryKey[2], 10);
});
test("executive API sends strict franchise filtering only when requested", async () => {
  const file = "api/leads.ts";
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(path.join(root, file), "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const node = ast.statements.find(
    (n) =>
      ts.isVariableStatement(n) &&
      n.declarationList.declarations.some(
        (d) => d.name.getText(ast) === "getVendorSalesExecutiveUsers",
      ),
  );
  const calls = [];
  const api = evaluate(node.getText(ast), {
    apiClient: {
      get: async (...args) => {
        calls.push(args);
        return { data: {} };
      },
    },
  });
  await api.getVendorSalesExecutiveUsers(1, 10, { strictFranchise: true });
  assert.equal(calls[0][1].params.franchise_id, 10);
  assert.equal(calls[0][1].params.strict_franchise, "true");
  await api.getVendorSalesExecutiveUsers(1);
  assert.equal(calls[1][1], undefined);
});

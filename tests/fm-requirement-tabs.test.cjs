const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const path = require("node:path");
const file = path.join(__dirname, "../src/lib/fm-requirement-tabs.ts");
const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const api = {};
new Function("exports", code)(api);
const field = (key) => ({ key, label: key, type: "text", required: false });
const original = [
  {
    ...field("marking"),
    type: "choice",
    options: [{ key: "yes", label: "Yes", fields: [field("depth")] }],
  },
  field("photos"),
];

test("creating the first tab preserves every existing field and conditional branch", () => {
  const tabs = api.addFMTab(original, "site", "Site checks");
  assert.equal(tabs.length, 1);
  assert.equal(tabs[0].type, "tab");
  assert.equal(tabs[0].fields, original);
  assert.equal(tabs[0].fields[0].options[0].fields[0].key, "depth");
});
test("a field can move into an empty section without losing options, nested fields or its key", () => {
  const initial = api.addFMTab(
    api.addFMTab(original, "site", "Site checks"),
    "uploads",
    "Uploads",
  );
  const moved = api.moveFMTabField(initial, "marking", "uploads");
  assert.deepEqual(
    moved[0].fields.map((f) => f.key),
    ["photos"],
  );
  assert.equal(moved[1].fields[0], original[0]);
  assert.equal(initial[0].fields.length, 2);
});
test("within-section and cross-section drops retain the requested order without duplicate fields", () => {
  const tabs = [
    { key: "one", type: "tab", fields: [field("a"), field("b"), field("c")] },
    { key: "two", type: "tab", fields: [field("d")] },
  ];
  const reordered = api.moveFMTabField(tabs, "a", "one", 2);
  assert.deepEqual(
    reordered[0].fields.map((f) => f.key),
    ["b", "c", "a"],
  );
  const moved = api.moveFMTabField(reordered, "a", "two", 0);
  assert.deepEqual(
    moved[1].fields.map((f) => f.key),
    ["a", "d"],
  );
  assert.equal(
    moved.flatMap((t) => t.fields).filter((f) => f.key === "a").length,
    1,
  );
});
test("tab order controls section order, and removing a section keeps its fields", () => {
  const tabs = api.addFMTab(
    api.addFMTab(original, "site", "Site"),
    "other",
    "Other",
  );
  const reordered = api.reorderFMTab(tabs, "other", "site");
  assert.deepEqual(
    reordered.map((t) => t.key),
    ["other", "site"],
  );
  const remaining = api.removeFMTab(tabs, "site");
  assert.equal(remaining.length, 1);
  assert.deepEqual(remaining[0].fields, original);
  assert.deepEqual(api.removeFMTab(remaining, "other"), original);
});
test("invalid drops are ignored and tab creation is bounded", () => {
  const tabs = Array.from({ length: 20 }, (_, i) => ({
    key: `tab_${i}`,
    type: "tab",
    fields: [],
  }));
  assert.equal(api.addFMTab(tabs, "extra", "Extra"), tabs);
  assert.equal(api.moveFMTabField(tabs, "unknown", "tab_0"), tabs);
  assert.equal(api.reorderFMTab(tabs, "unknown", "tab_0"), tabs);
});

test("dropping above or below a row works in either direction within a section", () => {
  const tabs = [
    { key: "one", type: "tab", fields: [field("a"), field("b"), field("c")] },
  ];
  for (const [key, over, after, expected] of [
    ["a", "b", false, ["a", "b", "c"]],
    ["a", "b", true, ["b", "a", "c"]],
    ["c", "b", false, ["a", "c", "b"]],
    ["c", "b", true, ["a", "b", "c"]],
  ]) {
    const moved = api.dropFMTabField(tabs, key, {
      tabKey: "one",
      fieldKey: over,
      after,
    });
    assert.deepEqual(
      moved[0].fields.map((item) => item.key),
      expected,
    );
  }
  assert.equal(
    api.dropFMTabField(tabs, "a", {
      tabKey: "one",
      fieldKey: "a",
      after: true,
    }),
    tabs,
  );
});

test("cross-section placement supports both sides of a row and empty sections", () => {
  const tabs = [
    { key: "one", type: "tab", fields: original },
    { key: "two", type: "tab", fields: [field("b"), field("c")] },
    { key: "empty", type: "tab", fields: [] },
  ];
  for (const [after, expected] of [
    [false, ["b", "marking", "c"]],
    [true, ["b", "c", "marking"]],
  ]) {
    const moved = api.dropFMTabField(tabs, "marking", {
      tabKey: "two",
      fieldKey: "c",
      after,
    });
    assert.deepEqual(
      moved[1].fields.map((item) => item.key),
      expected,
    );
    assert.equal(
      moved[1].fields.find((item) => item.key === "marking"),
      original[0],
    );
    assert.deepEqual(
      moved[0].fields.map((item) => item.key),
      ["photos"],
    );
  }
  const moved = api.dropFMTabField(tabs, "marking", {
    tabKey: "empty",
    after: false,
  });
  assert.equal(moved[2].fields[0], original[0]);
  assert.equal(
    api.dropFMTabField(tabs, "marking", { tabKey: "missing", after: false }),
    tabs,
  );
});

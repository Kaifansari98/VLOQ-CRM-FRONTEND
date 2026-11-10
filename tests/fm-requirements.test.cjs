const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const jsx = require("react/jsx-runtime");
function load(file, mocks) {
  const compiled = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../src", file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => {
      if (id === "react/jsx-runtime") return jsx;
      if (id === "react") return mocks.react ?? require("react");
      if (id in mocks) return mocks[id];
      throw new Error(`Unexpected dependency ${id}`);
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}
const contract = load("lib/fm-requirements.ts", {});
const component = (name) => Object.assign(() => null, { displayName: name });
const Button = component("Button"),
  Input = component("Input"),
  Textarea = component("Textarea");
const selects = Object.fromEntries(
  ["Select", "SelectContent", "SelectItem", "SelectTrigger", "SelectValue"].map(
    (name) => [name, component(name)],
  ),
);
const Picker = component("AssignToPicker"),
  TextInput = component("TextAreaInput"),
  Upload = component("FileUploadField");
const mocks = {
  react: {
    ...require("react"),
    useState: (value) => [
      typeof value === "function" ? value() : value,
      () => {},
    ],
    useRef: () => ({ current: null }),
    useEffect: () => {},
  },
  "@/components/assign-to-picker": Picker,
  "@/components/origin-text-area": TextInput,
  "@/components/custom/file-upload": { FileUploadField: Upload },
  "@/components/ui/tabs": Object.fromEntries(
    ["Tabs", "TabsList", "TabsTrigger", "TabsContent"].map((name) => [
      name,
      component(name),
    ]),
  ),
  "@/lib/utils": { cn: (...items) => items.filter(Boolean).join(" ") },
  "@/lib/fm-requirements": contract,
  "@/components/ui/button": { Button },
  "@/components/ui/input": { Input },
  "@/components/ui/textarea": { Textarea },
  "@/components/ui/label": { Label: component("Label") },
  "@/components/ui/select": selects,
  "lucide-react": Object.fromEntries(
    [
      "CheckCircle2",
      "ExternalLink",
      "ChevronDown",
      "ClipboardList",
      "FileText",
      "Layers",
      "Loader2",
      "Plus",
      "RefreshCw",
      "Save",
      "Trash2",
      "UploadCloud",
    ].map((name) => [name, component(name)]),
  ),
};
const Form = load(
  "components/fm-requirements/FMRequirementsForm.tsx",
  mocks,
).default;
const field = (key, label, type = "text") => ({
  key,
  label,
  type,
  required: false,
});
function fixture() {
  const form = {
    product_type_id: 2,
    product_type: "Kitchen",
    revision: "default:1",
    fields: [
      {
        ...field("marking", "Thiya Marking", "choice"),
        options: [
          {
            key: "yes",
            label: "Yes",
            fields: [field("elevation", "Elevation Side")],
          },
          { key: "no", label: "No", fields: [field("remark", "Remarks")] },
        ],
      },
      { ...field("site", "Site Photos", "upload"), upload_kind: "media" },
      field("observations", "Other Observations", "observations"),
    ],
  };
  let answers = {};
  const uploaded = [];
  const model = {
    query: { isLoading: false, isError: false, isFetching: false },
    forms: [form],
    getAnswers: () => answers,
    setAnswer: (_form, field, value) => {
      answers = { ...answers, [field.key]: value };
    },
    uploadFiles: async (_form, field, files) =>
      uploaded.push({ field: field.key, files }),
    uploading: {},
    uploads: {},
    isUploading: false,
    isSavingDraft: false,
    saveDraft() {},
    error: "",
  };
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (!node || typeof node !== "object") return [];
    if (
      typeof node.type === "function" &&
      [
        "Fields",
        "ProductChecklist",
        "FieldLabel",
        "YesNoField",
        "UploadField",
        "ObservationsField",
        "ProgressBadge",
      ].includes(node.type.name)
    )
      return nodes(node.type(node.props));
    return [node, ...nodes(node.props?.children)];
  }
  return {
    form,
    model,
    uploaded,
    render: () => nodes(Form({ model })),
    getAnswers: () => answers,
  };
}
test("selecting an option shows only its follow-up fields and supports branch changes", () => {
  const f = fixture();
  assert.equal(f.render().filter((node) => node.type === TextInput).length, 0);
  f.render()
    .find((node) => node.type === Picker)
    .props.onChange(0);
  assert.ok(
    f
      .render()
      .some((node) => node.props?.placeholder === "Enter elevation side"),
  );
  assert.equal(
    f.render().some((node) => node.props?.placeholder === "Enter remarks"),
    false,
  );
  f.render()
    .find((node) => node.type === Picker)
    .props.onChange(1);
  assert.equal(
    f
      .render()
      .some((node) => node.props?.placeholder === "Enter elevation side"),
    false,
  );
  assert.ok(
    f.render().some((node) => node.props?.placeholder === "Enter remarks"),
  );
});
test("supervisors can add, edit and remove multiple title-and-remark observations", () => {
  const f = fixture();
  const add = () =>
    f
      .render()
      .find(
        (node) =>
          node.type === Button &&
          Array.isArray(node.props.children) &&
          node.props.children.some(
            (child) =>
              typeof child === "string" &&
              /^Add (another )?observation$/.test(child),
          ),
      )
      .props.onClick();
  add();
  add();
  assert.equal(f.getAnswers().observations.length, 2);
  f.render()
    .find((node) => node.props?.id === "fm-2-observations-0-title")
    .props.onChange({ target: { value: "Plumbing" } });
  f.render()
    .find(
      (node) =>
        node.type === TextInput &&
        node.props?.placeholder === "Describe what needs attention…",
    )
    .props.onChange("Move inlet");
  assert.deepEqual(f.getAnswers().observations[0], {
    title: "Plumbing",
    remark: "Move inlet",
  });
  f.render()
    .find((node) => node.props?.["aria-label"] === "Remove observation 2")
    .props.onClick();
  assert.equal(f.getAnswers().observations.length, 1);
});
test("upload control accepts video for media fields and respects pending state", () => {
  const f = fixture();
  let input = f.render().find((node) => node.type === Upload);
  assert.ok(input.props.accept.includes("video/mp4"));
  const video = { name: "site.mp4", type: "video/mp4" };
  input.props.onChange([video]);
  assert.deepEqual(f.uploaded, [{ field: "site", files: [video] }]);
  f.model.uploading["2:site"] = true;
  input = f.render().find((node) => node.type === Upload);
  assert.equal(input.props.disabled, true);
});
test("FM submission uses the scoped JSON endpoint while large-scale uploads keep multipart", async () => {
  const calls = [];
  const api = load("api/final-measurement.ts", {
    "@/api/fm-requirements": {
      uploadFMFile: async () => ({ id: "test-upload" }),
    },
    "@/lib/apiClient": {
      apiClient: {
        post: async (...args) => {
          calls.push(args);
          return { data: { success: true } };
        },
      },
    },
  });
  const base = { vendor_id: 7, lead_id: 42, account_id: 4, created_by: 9 };
  await api.UploadFinalMeasurement({
    ...base,
    fm_requirements: [
      { product_type_id: 2, revision: "default:1", answers: {} },
    ],
  });
  assert.equal(calls[0][0], "/leads/fm-requirements/vendor/7/lead/42/submit");
  assert.equal(calls[0][1].groups[0].product_type_id, 2);
  await api.UploadFinalMeasurement(base);
  assert.equal(calls[1][0], "/leads/final-measurement/onboard");
  assert.ok(calls[1][1] instanceof FormData);
});

function summaryFixture() {
  let role = "super-admin",
    state = null;
  const saved = {
    id: 1,
    product_type_id: 2,
    revision: "vendor:1:1",
    updated_at: "2026-11-09T10:00:00.000Z",
    is_complete: true,
    productType: { type: "Modular Kitchen" },
    field_snapshot: [
      {
        key: "observations",
        label: "Other Observations",
        type: "observations",
        required: false,
      },
    ],
    answers: { observations: [{ title: "Window", remark: "Keep clearance" }] },
  };
  const data = { forms: [], responses: [saved], uploads: [] };
  const Editor = component("SavedFMEditor");
  const Summary = load("components/fm-requirements/FMRequirementsSummary.tsx", {
    ...mocks,
    react: {
      useState: () => [
        state,
        (value) => {
          state = value;
        },
      ],
    },
    "@tanstack/react-query": {
      useQuery: () => ({
        data,
        isLoading: false,
        isError: false,
        refetch: async () => ({ isSuccess: true, data }),
      }),
    },
    "@/api/fm-requirements": { getFMLead: async () => data },
    "@/redux/store": {
      useAppSelector: (fn) =>
        fn({ auth: { user: { user_type: { user_type: role } } } }),
    },
    "./EditFMRequirementsModal": Editor,
    "@/components/utils/ImageCard": {
      ImageComponent: component("ImageComponent"),
    },
    "@/components/utils/documentCard": component("DocumentCard"),
    "@/lib/format": { formatDate: () => "DATE" },
    "lucide-react": {
      Check: component("Check"),
      Minus: component("Minus"),
      ChevronDown: component("ChevronDown"),
      ClipboardList: component("ClipboardList"),
      Pencil: component("Pencil"),
    },
  }).default;
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (!node || typeof node !== "object") return [];
    if (typeof node.type === "function" && node.type.name === "Answers")
      return nodes(node.type(node.props));
    return [node, ...nodes(node.props?.children)];
  }
  return {
    render: () => nodes(Summary({ vendorId: 7, leadId: 42 })),
    setRole: (value) => {
      role = value;
      state = null;
    },
    data,
    saved,
    Editor,
  };
}
test("stored FM values appear for readers but edit controls are restricted to exactly the three requested roles", () => {
  const f = summaryFixture();
  for (const role of [
    "site-supervisor",
    "super-admin",
    "head-site-supervisor",
  ]) {
    f.setRole(role);
    assert.equal(
      f
        .render()
        .filter(
          (node) =>
            node.props?.["aria-label"] === "Edit Modular Kitchen FM values",
        ).length,
      1,
    );
  }
  for (const role of [
    "admin",
    "custom",
    "sales-executive",
    "auditor",
    undefined,
  ]) {
    f.setRole(role);
    assert.equal(
      f
        .render()
        .filter(
          (node) =>
            node.props?.["aria-label"] === "Edit Modular Kitchen FM values",
        ).length,
      0,
    );
    assert.ok(
      f.render().some((node) => node.props?.children === "Keep clearance"),
    );
  }
});
test("editing opens the selected saved response and its timestamp rather than the current master", () => {
  const f = summaryFixture();
  f.render()
    .find(
      (node) => node.props?.["aria-label"] === "Edit Modular Kitchen FM values",
    )
    .props.onClick({ preventDefault() {}, stopPropagation() {} });
  const editor = f.render().find((node) => node.type === f.Editor);
  assert.equal(editor.props.response, f.saved);
  assert.equal(editor.props.leadId, 42);
  assert.equal(editor.props.vendorId, 7);
  assert.equal(editor.props.response.updated_at, "2026-11-09T10:00:00.000Z");
  editor.props.onClose();
  assert.equal(
    f.render().some((node) => node.type === f.Editor),
    false,
  );
});
test("leads without saved responses show an empty state without manufacturing checklist values", () => {
  const f = summaryFixture();
  f.data.responses = [];
  assert.ok(
    f
      .render()
      .some(
        (node) =>
          node.props?.children ===
          "No checklist values have been saved for this lead yet.",
      ),
  );
  assert.equal(
    f
      .render()
      .some(
        (node) =>
          node.props?.["aria-label"] === "Edit Modular Kitchen FM values",
      ),
    false,
  );
});

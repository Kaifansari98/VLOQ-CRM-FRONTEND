import type { FMField } from "@/lib/fm-requirements";

export const fmTabs = (fields: FMField[]) =>
  fields.filter((field) => field.type === "tab");

export interface FMFieldDropTarget {
  tabKey: string;
  fieldKey?: string;
  after: boolean;
}

// Resolve the insertion index after removing the dragged field. This keeps
// before/after placement consistent within a section and between sections.
export function dropFMTabField(
  fields: FMField[],
  fieldKey: string,
  target: FMFieldDropTarget,
): FMField[] {
  if (target.fieldKey === fieldKey) return fields;
  const tab = fmTabs(fields).find((tab) => tab.key === target.tabKey);
  if (!tab) return fields;
  const items = (tab.fields ?? []).filter((field) => field.key !== fieldKey);
  const index = items.findIndex((field) => field.key === target.fieldKey);
  return moveFMTabField(
    fields,
    fieldKey,
    tab.key,
    index < 0 ? undefined : index + Number(target.after),
  );
}
export function addFMTab(
  fields: FMField[],
  key: string,
  label: string,
): FMField[] {
  const tabs = fmTabs(fields);
  if (tabs.length >= 20) return fields;
  return tabs.length
    ? [...tabs, { key, label, type: "tab", required: false, fields: [] }]
    : [{ key, label, type: "tab", required: false, fields }];
}
export function removeFMTab(fields: FMField[], key: string): FMField[] {
  const index = fields.findIndex(
    (field) => field.key === key && field.type === "tab",
  );
  if (index < 0) return fields;
  const removed = fields[index];
  const remaining = fields.filter((field) => field.key !== key);
  if (!remaining.length) return removed.fields ?? [];
  const target = remaining[Math.max(0, index - 1)];
  return remaining.map((field) =>
    field.key === target.key
      ? {
          ...field,
          fields: [...(field.fields ?? []), ...(removed.fields ?? [])],
        }
      : field,
  );
}
export function moveFMTabField(
  fields: FMField[],
  fieldKey: string,
  targetKey: string,
  targetIndex?: number,
): FMField[] {
  const source = fields.find(
    (tab) =>
      tab.type === "tab" && tab.fields?.some((field) => field.key === fieldKey),
  );
  const target = fields.find(
    (tab) => tab.type === "tab" && tab.key === targetKey,
  );
  const field = source?.fields?.find((field) => field.key === fieldKey);
  if (!source || !target || !field) return fields;
  const nextTarget = (target.fields ?? []).filter(
    (item) => item.key !== fieldKey,
  );
  const index = Math.max(
    0,
    Math.min(targetIndex ?? nextTarget.length, nextTarget.length),
  );
  nextTarget.splice(index, 0, field);
  return fields.map((tab) =>
    tab.key === targetKey
      ? { ...tab, fields: nextTarget }
      : tab.key === source.key
        ? {
            ...tab,
            fields: tab.fields!.filter((item) => item.key !== fieldKey),
          }
        : tab,
  );
}
export function reorderFMTab(
  fields: FMField[],
  activeKey: string,
  overKey: string,
): FMField[] {
  const from = fields.findIndex((field) => field.key === activeKey);
  const to = fields.findIndex((field) => field.key === overKey);
  if (from < 0 || to < 0 || from === to) return fields;
  const next = [...fields];
  const [tab] = next.splice(from, 1);
  next.splice(to, 0, tab);
  return next;
}

"use client";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { getEventCoordinates } from "@dnd-kit/utilities";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { FMField } from "@/lib/fm-requirements";
import {
  addFMTab,
  dropFMTabField,
  fmTabs,
  removeFMTab,
  reorderFMTab,
  type FMFieldDropTarget,
} from "@/lib/fm-requirement-tabs";
import { SortableItem, SortableItemHandle } from "@/components/reui/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
const dropPrefix = "tab-drop:";
let counter = 0;
const measuring = { droppable: { strategy: MeasuringStrategy.Always } };
// Keep the compact preview just under the pointer regardless of where on a
// wide/expanded card the drag started. The source card keeps its own geometry.
const alignPreviewToCursor: Modifier = ({
  activatorEvent,
  draggingNodeRect,
  transform,
}) => {
  const pointer = activatorEvent && getEventCoordinates(activatorEvent);
  if (!pointer || !draggingNodeRect) return transform;
  return {
    ...transform,
    x: transform.x + pointer.x - draggingNodeRect.left - 28,
    y: transform.y + pointer.y - draggingNodeRect.top - 22,
  };
};
const previewModifiers = [alignPreviewToCursor];
function TabDropZone({
  tabKey,
  children,
}: {
  tabKey: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dropPrefix + tabKey });
  return (
    <div
      ref={setNodeRef}
      data-fm-tab-drop={tabKey}
      className={cn(
        "min-h-28 space-y-3 rounded-b-xl p-4 transition-colors",
        isOver && "bg-primary/5 ring-1 ring-inset ring-primary/30",
      )}
    >
      {children}
    </div>
  );
}
export default function FMRequirementTabsEditor({
  fields,
  onChange,
  disabled,
  renderFields,
}: {
  fields: FMField[];
  onChange: (fields: FMField[]) => void;
  disabled: boolean;
  renderFields: (
    fields: FMField[],
    onChange: (fields: FMField[]) => void,
    tabKey?: string,
    insertion?: FMFieldDropTarget | null,
  ) => ReactNode;
}) {
  const tabs = fmTabs(fields);
  let sectionNumber = tabs.length + 1;
  while (
    tabs.some(
      (tab) => tab.label.trim().toLowerCase() === `section ${sectionNumber}`,
    )
  )
    sectionNumber++;
  const nextSectionLabel = `Section ${sectionNumber}`;
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [insertion, setInsertion] = useState<FMFieldDropTarget | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const active =
    tabs.find((tab) => tab.key === activeKey) ??
    tabs
      .flatMap((tab) => tab.fields ?? [])
      .find((field) => field.key === activeKey);
  const collision: CollisionDetection = (args) => {
    const sectionDrag = tabs.some((tab) => tab.key === String(args.active.id));
    const filtered = {
      ...args,
      droppableContainers: args.droppableContainers.filter((container) =>
        sectionDrag
          ? tabs.some((tab) => tab.key === String(container.id))
          : String(container.id).startsWith(dropPrefix) ||
            tabs.some((tab) =>
              tab.fields?.some((field) => field.key === String(container.id)),
            ),
      ),
    };
    const pointers = pointerWithin(filtered);
    const rows = pointers.filter(
      (hit) => !String(hit.id).startsWith(dropPrefix),
    );
    return rows.length
      ? rows
      : pointers.length
        ? pointers
        : closestCenter(filtered);
  };
  const getInsertion = ({
    active,
    over,
  }: Pick<DragMoveEvent, "active" | "over">): FMFieldDropTarget | null => {
    if (!over || tabs.some((tab) => tab.key === String(active.id))) return null;
    const overKey = String(over.id);
    const target = overKey.startsWith(dropPrefix)
      ? tabs.find((tab) => tab.key === overKey.slice(dropPrefix.length))
      : tabs.find((tab) => tab.fields?.some((field) => field.key === overKey));
    if (!target || active.id === over.id) return null;
    const translated = active.rect.current.translated;
    return {
      tabKey: target.key,
      fieldKey: overKey.startsWith(dropPrefix) ? undefined : overKey,
      after:
        !!translated &&
        translated.top + translated.height / 2 >
          over.rect.top + over.rect.height / 2,
    };
  };
  const indicateInsertion = (event: DragMoveEvent) => {
    const next = getInsertion(event);
    setInsertion((previous) =>
      previous?.tabKey === next?.tabKey &&
      previous?.fieldKey === next?.fieldKey &&
      previous?.after === next?.after
        ? previous
        : next,
    );
  };
  const finish = ({ active, over }: DragEndEvent) => {
    setActiveKey(null);
    setInsertion(null);
    if (disabled || !over || active.id === over.id) return;
    const key = String(active.id);
    const overKey = String(over.id);
    if (tabs.some((tab) => tab.key === key)) {
      onChange(reorderFMTab(fields, key, overKey));
      return;
    }
    const target = getInsertion({ active, over });
    if (!target) return;
    // Commit cross-section moves on drop, as in kanban-02, so the active
    // editor stays mounted throughout the drag and cancellation keeps all data.
    onChange(dropFMTabField(fields, key, target));
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed bg-muted/20 p-4">
        <div>
          <p className="text-sm font-medium">Tab sections</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Create sections for the measurement modal. Drag section headers to
            reorder tabs, or drag fields between sections.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || tabs.length >= 20}
          onClick={() =>
            onChange(
              addFMTab(
                fields,
                `tab_${Date.now().toString(36)}_${++counter}`,
                nextSectionLabel,
              ),
            )
          }
        >
          <Plus size={14} />
          Add tab section
        </Button>
      </div>
      {!tabs.length ? (
        renderFields(fields, onChange)
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collision}
          measuring={measuring}
          onDragStart={({ active }) => setActiveKey(String(active.id))}
          onDragMove={indicateInsertion}
          onDragOver={indicateInsertion}
          onDragEnd={finish}
          onDragCancel={() => {
            setActiveKey(null);
            setInsertion(null);
          }}
        >
          <SortableContext
            items={tabs.map((tab) => tab.key)}
            strategy={rectSortingStrategy}
          >
            <div
              className={cn(
                "grid w-full items-start gap-4",
                tabs.length > 1 && "xl:grid-cols-2",
              )}
            >
              {tabs.map((tab) => (
                <SortableItem
                  key={tab.key}
                  value={tab.key}
                  disabled={disabled}
                  dragOnCard
                  className="overflow-hidden rounded-xl border bg-background"
                >
                  <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-3">
                    <SortableItemHandle
                      render={<button type="button" disabled={disabled} />}
                      aria-label={`Drag to reorder section ${tab.label}`}
                      className="flex size-8 shrink-0 touch-none items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <GripVertical size={16} />
                    </SortableItemHandle>
                    <Input
                      value={tab.label}
                      maxLength={200}
                      disabled={disabled}
                      aria-label={`Section title ${tab.label}`}
                      className="min-w-0 flex-1 bg-background font-medium"
                      onChange={(event) =>
                        onChange(
                          fields.map((field) =>
                            field.key === tab.key
                              ? { ...field, label: event.target.value }
                              : field,
                          ),
                        )
                      }
                    />
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {tab.fields?.length ?? 0}{" "}
                      {(tab.fields?.length ?? 0) === 1 ? "field" : "fields"}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={disabled}
                      aria-label={`Remove section ${tab.label}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Remove this tab section? Its fields will be kept in the checklist or moved to a remaining section.",
                          )
                        )
                          onChange(removeFMTab(fields, tab.key));
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <TabDropZone tabKey={tab.key}>
                    {!tab.fields?.length && (
                      <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                        Drag fields here, or add a new field below.
                      </p>
                    )}
                    <SortableContext
                      items={(tab.fields ?? []).map((field) => field.key)}
                      strategy={verticalListSortingStrategy}
                    >
                      {renderFields(
                        tab.fields ?? [],
                        (next) =>
                          onChange(
                            fields.map((field) =>
                              field.key === tab.key
                                ? { ...field, fields: next }
                                : field,
                            ),
                          ),
                        tab.key,
                        insertion?.tabKey === tab.key ? insertion : null,
                      )}
                    </SortableContext>
                    {insertion?.tabKey === tab.key && !insertion.fieldKey && (
                      <div
                        aria-hidden="true"
                        className="h-1 rounded-full bg-primary"
                      />
                    )}
                  </TabDropZone>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
          {typeof document !== "undefined" &&
            createPortal(
              <DragOverlay modifiers={previewModifiers} dropAnimation={null}>
                {active ? (
                  <div
                    data-fm-drag-preview
                    className="pointer-events-none flex w-80 max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm font-medium shadow-xl"
                  >
                    <GripVertical size={16} className="text-muted-foreground" />
                    {active.label}
                  </div>
                ) : null}
              </DragOverlay>,
              document.body,
            )}
        </DndContext>
      )}
    </div>
  );
}

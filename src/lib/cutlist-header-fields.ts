// Fixed spreadsheet fields for the mapping editor. Keep in sync with the backend import metadata.
export const CUTLIST_HEADER_FIELDS = [
  { field: "item_name", label: "Item Name", importField: "name", required: true, aliases: ["name", "description"] },
  { field: "material_details", label: "Article Code", importField: "articleCode", required: true, aliases: ["material details", "articlecode"] },
  { field: "category_name", label: "Category Name", importField: "categoryName", required: false, aliases: ["category"] },
  { field: "group_name", label: "Group Name", importField: "groupName", required: true, aliases: ["group"] },
  { field: "length", label: "Length", importField: "l1", required: true, aliases: ["l1"] },
  { field: "width", label: "Width", importField: "l2", required: true, aliases: ["l2"] },
  { field: "thickness", label: "Thickness", importField: "l3", required: true, aliases: ["l3"] },
  { field: "qty", label: "Qty", importField: "qty", required: true, aliases: ["quantity"] },
  { field: "unique_code", label: "Unique Code", importField: "barcode1", required: false, aliases: ["barcode1", "barcode 1", "unique code 1"] },
  { field: "elf", label: "EL1 / ELF", importField: "el1", required: false, aliases: ["el1", "elf"] },
  { field: "elb", label: "EL2 / ELB", importField: "el2", required: false, aliases: ["el2", "elb"] },
  { field: "esl", label: "SL1 / ESL", importField: "sl1", required: false, aliases: ["sl1", "esl"] },
  { field: "esr", label: "SL2 / ESR", importField: "sl2", required: false, aliases: ["sl2", "esr"] },
  { field: "weight", label: "Weight", importField: "weight", required: false, aliases: ["wt", "wt.", "weight kg", "weight (kg)", "total weight", "totalweight"] },
  { field: "custom_packing_group", label: "Custom Packing Group", importField: "customPackingGroup", required: false, aliases: [] },
] as const;

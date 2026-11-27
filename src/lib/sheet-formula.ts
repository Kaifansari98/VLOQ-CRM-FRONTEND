// Excel-like formulas for the machine worksheets (e.g. "=B2*B1", "=SUM(B1:B3)/2", "=ROUND(B4*8%, 2)").
//
// Formulas are stored with references pinned to row codes ("=[code_a]*[code_b]") rather than positions,
// so inserting, deleting or reordering rows never silently points a formula at a different row; a reference
// to a deleted row shows as #REF!, like Excel. Users always see and type positional references (B1, B2...),
// qualified with the sheet name for other sheets ("Machine Cost.B11", or Excel's "'Machine Cost'!B11").
// Row codes are unique across a machine's sheets, so a stored reference never needs the sheet name.
// Parsing is a small recursive-descent parser: formulas are never passed to eval/Function.

// A cell holds a number (`amount`), a formula, or plain text such as "300x300" or "NA".
// `group` is the sheet a cell belongs to when a whole workbook is evaluated; ranges can't span sheets.
export type SheetCell = { id: number; code?: string; amount: string; formula?: string; text?: string; group?: string };
export type WorkbookSheet = { title: string; rows: SheetCell[] };
export type CellValue = { value: number; error?: string; text?: string };

const REF_ERROR = "#REF!";

class FormulaError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

type Token =
  | { type: "num"; value: number }
  | { type: "ref"; code: string }
  | { type: "name"; value: string }
  | { type: "op"; value: string };

type Node =
  | { kind: "num"; value: number }
  | { kind: "ref"; code: string }
  | { kind: "range"; from: string; to: string }
  | { kind: "unary"; op: string; arg: Node }
  | { kind: "binary"; op: string; left: Node; right: Node }
  | { kind: "percent"; arg: Node }
  | { kind: "call"; name: string; args: Node[] };

const tokenize = (source: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    if (/\s/.test(char)) {
      i += 1;
    } else if (/[\d.]/.test(char)) {
      const match = /^(\d+(\.\d*)?|\.\d+)/.exec(source.slice(i));
      if (!match) throw new FormulaError("#ERROR!");
      tokens.push({ type: "num", value: Number(match[0]) });
      i += match[0].length;
    } else if (char === "[") {
      const end = source.indexOf("]", i);
      if (end === -1) throw new FormulaError("#ERROR!");
      tokens.push({ type: "ref", code: source.slice(i + 1, end) });
      i = end + 1;
    } else if (/[A-Za-z_]/.test(char)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(i))!;
      tokens.push({ type: "name", value: match[0].toUpperCase() });
      i += match[0].length;
    } else if ("+-*/^(),:%".includes(char)) {
      tokens.push({ type: "op", value: char });
      i += 1;
    } else {
      throw new FormulaError("#ERROR!");
    }
  }
  return tokens;
};

const parse = (stored: string): Node => {
  if (!stored.startsWith("=")) throw new FormulaError("#ERROR!");
  const tokens = tokenize(stored.slice(1));
  let position = 0;
  const peek = () => tokens[position];
  const isOp = (value: string) => peek()?.type === "op" && (peek() as { value: string }).value === value;
  const expectOp = (value: string) => {
    if (!isOp(value)) throw new FormulaError("#ERROR!");
    position += 1;
  };

  // expression := term (("+" | "-") term)*
  const expression = (): Node => {
    let node = term();
    while (isOp("+") || isOp("-")) {
      const op = (tokens[position++] as { value: string }).value;
      node = { kind: "binary", op, left: node, right: term() };
    }
    return node;
  };
  // term := power (("*" | "/") power)*
  const term = (): Node => {
    let node = power();
    while (isOp("*") || isOp("/")) {
      const op = (tokens[position++] as { value: string }).value;
      node = { kind: "binary", op, left: node, right: power() };
    }
    return node;
  };
  // power := unary ("^" unary)*   (left-associative, as in Excel)
  const power = (): Node => {
    let node = unary();
    while (isOp("^")) {
      position += 1;
      node = { kind: "binary", op: "^", left: node, right: unary() };
    }
    return node;
  };
  // unary := ("+" | "-") unary | postfix
  const unary = (): Node => {
    if (isOp("-") || isOp("+")) {
      const op = (tokens[position++] as { value: string }).value;
      return { kind: "unary", op, arg: unary() };
    }
    return postfix();
  };
  // postfix := primary "%"*
  const postfix = (): Node => {
    let node = primary();
    while (isOp("%")) {
      position += 1;
      node = { kind: "percent", arg: node };
    }
    return node;
  };
  const primary = (): Node => {
    const token = peek();
    if (!token) throw new FormulaError("#ERROR!");
    if (token.type === "num") {
      position += 1;
      return { kind: "num", value: token.value };
    }
    if (token.type === "ref") {
      position += 1;
      if (isOp(":")) {
        position += 1;
        const end = peek();
        if (end?.type !== "ref") throw new FormulaError("#ERROR!");
        position += 1;
        return { kind: "range", from: token.code, to: end.code };
      }
      return { kind: "ref", code: token.code };
    }
    if (token.type === "name") {
      position += 1;
      expectOp("(");
      const args: Node[] = [];
      if (!isOp(")")) {
        args.push(expression());
        while (isOp(",")) {
          position += 1;
          args.push(expression());
        }
      }
      expectOp(")");
      return { kind: "call", name: token.value, args };
    }
    if (isOp("(")) {
      position += 1;
      const node = expression();
      expectOp(")");
      return node;
    }
    throw new FormulaError("#ERROR!");
  };

  const root = expression();
  if (position !== tokens.length) throw new FormulaError("#ERROR!");
  if (root.kind === "range") throw new FormulaError("#VALUE!");
  return root;
};

const FUNCTIONS: Record<string, (values: number[]) => number> = {
  SUM: (values) => values.reduce((sum, value) => sum + value, 0),
  MIN: (values) => (values.length ? Math.min(...values) : 0),
  MAX: (values) => (values.length ? Math.max(...values) : 0),
  AVERAGE: (values) => {
    if (!values.length) throw new FormulaError("#DIV/0!");
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  },
  ABS: (values) => {
    if (values.length !== 1) throw new FormulaError("#VALUE!");
    return Math.abs(values[0]);
  },
  ROUND: (values) => {
    if (values.length < 1 || values.length > 2) throw new FormulaError("#VALUE!");
    const factor = 10 ** Math.trunc(values[1] ?? 0);
    return Math.round(values[0] * factor) / factor;
  },
};

/** Returns an Excel-style error code (e.g. "#ERROR!") when the stored formula cannot be parsed, else null. */
export const validateFormula = (stored: string): string | null => {
  try {
    parse(stored);
    return null;
  } catch (error) {
    return error instanceof FormulaError ? error.code : "#ERROR!";
  }
};

/**
 * Evaluates every row; formula rows may reference other rows (including other formula rows).
 * Pass all sheets' rows in sheet order (each with its `group`) to resolve references across sheets.
 */
export const evaluateSheet = (rows: SheetCell[]): Map<number, CellValue> => {
  const indexByCode = new Map<string, number>();
  rows.forEach((row, index) => row.code && indexByCode.set(row.code, index));
  const results = new Map<number, CellValue>();
  const visiting = new Set<number>();

  // Arithmetic on a text cell is #VALUE!, like Excel.
  const valueOfRow = (index: number): number => {
    const result = evaluateRow(index);
    if (result.error) throw new FormulaError(result.error);
    if (result.text !== undefined) throw new FormulaError("#VALUE!");
    return result.value;
  };
  // Function arguments that are references or ranges skip text cells (Excel's SUM/MIN/... ignore text).
  const numbersFromRows = (indexes: number[]): number[] =>
    indexes.flatMap((index) => {
      const result = evaluateRow(index);
      if (result.error) throw new FormulaError(result.error);
      return result.text !== undefined ? [] : [result.value];
    });
  const rowIndex = (code: string) => {
    const index = indexByCode.get(code);
    if (index === undefined) throw new FormulaError(REF_ERROR);
    return index;
  };
  const evaluateNode = (node: Node): number => {
    switch (node.kind) {
      case "num":
        return node.value;
      case "ref":
        return valueOfRow(rowIndex(node.code));
      case "range":
        throw new FormulaError("#VALUE!");
      case "unary":
        return node.op === "-" ? -evaluateNode(node.arg) : evaluateNode(node.arg);
      case "percent":
        return evaluateNode(node.arg) / 100;
      case "binary": {
        const left = evaluateNode(node.left);
        const right = evaluateNode(node.right);
        if (node.op === "+") return left + right;
        if (node.op === "-") return left - right;
        if (node.op === "*") return left * right;
        if (node.op === "/") {
          if (right === 0) throw new FormulaError("#DIV/0!");
          return left / right;
        }
        return left ** right;
      }
      case "call": {
        const fn = FUNCTIONS[node.name];
        if (!fn) throw new FormulaError("#NAME?");
        const values = node.args.flatMap((arg) => {
          if (arg.kind === "ref") return numbersFromRows([rowIndex(arg.code)]);
          if (arg.kind !== "range") return [evaluateNode(arg)];
          const [start, end] = [rowIndex(arg.from), rowIndex(arg.to)].sort((a, b) => a - b);
          if (rows[start].group !== rows[end].group) throw new FormulaError(REF_ERROR);
          return numbersFromRows(Array.from({ length: end - start + 1 }, (_, offset) => start + offset));
        });
        return fn(values);
      }
    }
  };

  const evaluateRow = (index: number): CellValue => {
    const row = rows[index];
    const cached = results.get(row.id);
    if (cached) return cached;
    if (!row.formula) {
      const result: CellValue = row.text ? { value: 0, text: row.text } : { value: row.amount ? Number(row.amount) : 0 };
      results.set(row.id, result);
      return result;
    }
    // A row reached again while it is still being evaluated is a circular reference.
    if (visiting.has(row.id)) return { value: 0, error: "#CIRC!" };
    visiting.add(row.id);
    let result: CellValue;
    try {
      const value = evaluateNode(parse(row.formula));
      // Trim floating-point noise such as 0.1 + 0.2 = 0.30000000000000004.
      result = Number.isFinite(value) ? { value: Math.round(value * 1e10) / 1e10 } : { value: 0, error: "#NUM!" };
    } catch (error) {
      result = { value: 0, error: error instanceof FormulaError ? error.code : "#ERROR!" };
    }
    visiting.delete(row.id);
    results.set(row.id, result);
    return result;
  };

  rows.forEach((_, index) => evaluateRow(index));
  return results;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Matches, in order: a stored "[code]" (left alone), or a B-reference optionally qualified by a sheet title
// ("Machine Cost.B3", "'Machine Cost'!B3") and optionally a range end (":B9"). Bare references must not be
// part of a longer word or a function name (e.g. the B in "ABS(").
const referencePattern = (titles: string[]) => {
  const alternatives = titles.length ? [...titles].sort((a, b) => b.length - a.length).map(escapeRegExp).join("|") : "(?!)";
  return new RegExp(
    `(\\[[^\\]]*\\])|(?:(?:'(${alternatives})'|(${alternatives}))[.!]|(?<![A-Za-z0-9_.!']))\\$?B\\$?(\\d+)(?::\\$?B\\$?(\\d+))?(?![A-Za-z0-9_(])`,
    "gi",
  );
};
const sheetByTitle = (workbook: WorkbookSheet[], title: string | undefined, current: number) =>
  title === undefined ? workbook[current] : workbook.find((sheet) => sheet.title.toLowerCase() === title.toLowerCase());

/**
 * "=B2*b1+Machine Cost.B11" (what the user types on sheet `current`) -> "=[code]*[code]+[code]" (what is stored).
 * Unqualified references point at the current sheet.
 */
export const toStoredFormula = (display: string, workbook: WorkbookSheet[], current: number): string =>
  display
    .trim()
    .replace(/#REF!/gi, `[${REF_ERROR}]`)
    .replace(referencePattern(workbook.map((sheet) => sheet.title)), (match, bracketed: string | undefined, quotedTitle: string | undefined, title: string | undefined, rowNumber: string, endRowNumber: string | undefined) => {
      if (bracketed) return bracketed;
      const sheet = sheetByTitle(workbook, quotedTitle ?? title, current);
      const ref = (row: string) => `[${sheet?.rows[Number(row) - 1]?.code ?? REF_ERROR}]`;
      return endRowNumber ? `${ref(rowNumber)}:${ref(endRowNumber)}` : ref(rowNumber);
    });

/** Stored form back to what the user sees on sheet `current`, using each referenced row's current sheet and position. */
export const toDisplayFormula = (stored: string, workbook: WorkbookSheet[], current: number): string => {
  const locate = (code: string) => {
    for (let sheetIndex = 0; sheetIndex < workbook.length; sheetIndex += 1) {
      const rowIndex = workbook[sheetIndex].rows.findIndex((row) => row.code === code);
      if (rowIndex !== -1) return { sheetIndex, rowIndex };
    }
    return null;
  };
  const prefix = (sheetIndex: number) => (sheetIndex === current ? "" : `${workbook[sheetIndex].title}.`);
  const show = (code: string) => {
    const found = locate(code);
    return found ? `${prefix(found.sheetIndex)}B${found.rowIndex + 1}` : REF_ERROR;
  };
  return stored.replace(/\[([^\]]*)\](?::\[([^\]]*)\])?/g, (_, from: string, to: string | undefined) => {
    if (to === undefined) return show(from);
    const [start, end] = [locate(from), locate(to)];
    // A range within one sheet is written once with its sheet name: "Machine Cost.B1:B10".
    if (start && end && start.sheetIndex === end.sheetIndex) return `${prefix(start.sheetIndex)}B${start.rowIndex + 1}:B${end.rowIndex + 1}`;
    return `${show(from)}:${show(to)}`;
  });
};

/** Cells referenced by a formula as typed on sheet `current` (ranges expanded), for highlighting while editing. */
export const referencedCells = (display: string, workbook: WorkbookSheet[], current: number): { sheetIndex: number; rowIndex: number }[] => {
  const cells: { sheetIndex: number; rowIndex: number }[] = [];
  for (const match of display.matchAll(referencePattern(workbook.map((sheet) => sheet.title)))) {
    const [, bracketed, quotedTitle, title, rowNumber, endRowNumber] = match;
    if (bracketed) continue;
    const sheet = sheetByTitle(workbook, quotedTitle ?? title, current);
    if (!sheet) continue;
    const sheetIndex = workbook.indexOf(sheet);
    const [start, end] = [Number(rowNumber), Number(endRowNumber ?? rowNumber)].sort((a, b) => a - b);
    for (let row = start; row <= end && row <= sheet.rows.length; row += 1) cells.push({ sheetIndex, rowIndex: row - 1 });
  }
  return cells;
};

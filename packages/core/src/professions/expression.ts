import { TemplateError } from "./schema.ts";

type Token = { kind: "number" | "identifier" | "symbol"; text: string };
export type ExpressionNode =
  | { kind: "number"; value: number }
  | { kind: "reference"; namespace: "field" | "setting" | "cost" | "result"; key: string }
  | { kind: "unary"; operator: "-"; value: ExpressionNode }
  | { kind: "binary"; operator: "+" | "-" | "*" | "/"; left: ExpressionNode; right: ExpressionNode }
  | { kind: "call"; name: "min" | "max" | "ceil" | "floor" | "round" | "abs"; args: ExpressionNode[] };
const allowedFunctions = new Set(["min", "max", "ceil", "floor", "round", "abs"]);
const namespaces = new Set(["field", "setting", "cost", "result"]);

function tokenize(source: string): Token[] {
  if (source.length > 500) throw new TemplateError("FORMULA_LENGTH", "Formül en fazla 500 karakter olabilir.");
  const tokens: Token[] = [];
  const pattern = /\s*(?:(\d+(?:\.\d+)?)|([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?)|([+\-*/(),]))/y;
  let offset = 0;
  while (offset < source.length) {
    pattern.lastIndex = offset;
    const match = pattern.exec(source);
    if (!match) {
      if (!source.slice(offset).trim()) break;
      throw new TemplateError("FORMULA_SYNTAX", `Formülde geçersiz karakter: ${source[offset]}`);
    }
    tokens.push({ kind: match[1] ? "number" : match[2] ? "identifier" : "symbol", text: match[1] || match[2] || match[3] });
    if (tokens.length > 200) throw new TemplateError("FORMULA_LENGTH", "Formül çok uzun.");
    offset = pattern.lastIndex;
  }
  return tokens;
}

export function parseExpression(source: string): { node: ExpressionNode; references: Set<string> } {
  const tokens = tokenize(source);
  if (!tokens.length) throw new TemplateError("FORMULA_SYNTAX", "Formül boş olamaz.");
  const references = new Set<string>();
  let position = 0;
  const current = () => tokens[position]?.text;
  const consume = (text: string) => { if (current() !== text) throw new TemplateError("FORMULA_SYNTAX", `Formülde ${text} bekleniyor.`); position++; };
  function primary(depth: number): ExpressionNode {
    if (depth > 24) throw new TemplateError("FORMULA_DEPTH", "Formül çok iç içe.");
    const token = tokens[position++];
    if (!token) throw new TemplateError("FORMULA_SYNTAX", "Formül eksik.");
    if (token.kind === "number") {
      const value = Number(token.text);
      if (!Number.isFinite(value)) throw new TemplateError("FORMULA_VALUE", "Formülde sayı çok büyük.");
      return { kind: "number", value };
    }
    if (token.text === "-") return { kind: "unary", operator: "-", value: primary(depth + 1) };
    if (token.text === "(") { const node = expression(depth + 1); consume(")"); return node; }
    if (token.kind === "identifier") {
      if (current() === "(") {
        if (!allowedFunctions.has(token.text)) throw new TemplateError("FORMULA_FUNCTION", `Bilinmeyen fonksiyon: ${token.text}`);
        position++;
        const args: ExpressionNode[] = [];
        if (current() !== ")") {
          do { args.push(expression(depth + 1)); if (current() !== ",") break; position++; } while (args.length < 8);
        }
        consume(")");
        if (!args.length || args.length > 4 || ["ceil", "floor", "abs"].includes(token.text) && args.length !== 1 ||
          token.text === "round" && args.length > 2) throw new TemplateError("FORMULA_ARITY", "Fonksiyonun parametre sayısı geçersiz.");
        return { kind: "call", name: token.text as Extract<ExpressionNode, { kind: "call" }>["name"], args };
      }
      const [namespace, key, extra] = token.text.split(".");
      if (!key || extra || !namespaces.has(namespace)) throw new TemplateError("FORMULA_REFERENCE", `Bilinmeyen değişken: ${token.text}`);
      references.add(token.text);
      return { kind: "reference", namespace: namespace as Extract<ExpressionNode, { kind: "reference" }>["namespace"], key };
    }
    throw new TemplateError("FORMULA_SYNTAX", `Beklenmeyen ifade: ${token.text}`);
  }
  function term(depth: number): ExpressionNode {
    let node = primary(depth);
    while (current() === "*" || current() === "/") { const operator = tokens[position++].text as "*" | "/"; node = { kind: "binary", operator, left: node, right: primary(depth + 1) }; }
    return node;
  }
  function expression(depth: number): ExpressionNode {
    let node = term(depth);
    while (current() === "+" || current() === "-") { const operator = tokens[position++].text as "+" | "-"; node = { kind: "binary", operator, left: node, right: term(depth + 1) }; }
    return node;
  }
  const node = expression(0);
  if (position !== tokens.length) throw new TemplateError("FORMULA_SYNTAX", "Formülde beklenmeyen ek ifade var.");
  return { node, references };
}

export type FormulaContext = { field: Record<string, number>; setting: Record<string, number>; cost: Record<string, number>; result: Record<string, number> };
export function evaluateExpression(node: ExpressionNode, context: FormulaContext, depth = 0): number {
  if (depth > 30) throw new TemplateError("FORMULA_DEPTH", "Formül çok iç içe.");
  let value: number;
  if (node.kind === "number") value = node.value;
  else if (node.kind === "reference") {
    const resolved = context[node.namespace][node.key];
    if (resolved === undefined) throw new TemplateError("MISSING_REFERENCE", `${node.namespace}.${node.key} değeri tanımlı değil.`, node.key);
    value = resolved;
  } else if (node.kind === "unary") value = -evaluateExpression(node.value, context, depth + 1);
  else if (node.kind === "binary") {
    const left = evaluateExpression(node.left, context, depth + 1);
    const right = evaluateExpression(node.right, context, depth + 1);
    if (node.operator === "/" && right === 0) throw new TemplateError("DIVISION_BY_ZERO", "Formülde sıfıra bölme var.");
    value = node.operator === "+" ? left + right : node.operator === "-" ? left - right : node.operator === "*" ? left * right : left / right;
  } else {
    const args = node.args.map((arg) => evaluateExpression(arg, context, depth + 1));
    value = node.name === "min" ? Math.min(...args) : node.name === "max" ? Math.max(...args) :
      node.name === "ceil" ? Math.ceil(args[0]) : node.name === "floor" ? Math.floor(args[0]) :
      node.name === "abs" ? Math.abs(args[0]) : Math.round(args[0] * 10 ** (args[1] ?? 0)) / 10 ** (args[1] ?? 0);
  }
  if (!Number.isFinite(value) || Math.abs(value) > 1e12) throw new TemplateError("FORMULA_VALUE", "Formül sonucu geçersiz veya çok büyük.");
  return value;
}

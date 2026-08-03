#!/usr/bin/env node
/**
 * Normaliza classes de cor "cruas" do Tailwind para os tokens semânticos
 * do design system (globals.css). Roda sobre src/**\/*.tsx.
 */
import fs from "node:fs";
import path from "node:path";

const NEUTRALS = new Set(["gray", "slate", "zinc", "neutral", "stone"]);
const SEMANTIC = {
  red: "destructive", rose: "destructive",
  green: "success", emerald: "success", teal: "success", lime: "success",
  amber: "warning", yellow: "warning", orange: "warning",
  blue: "info", sky: "info", cyan: "info",
  indigo: "primary", violet: "primary", purple: "primary", fuchsia: "primary", pink: "primary",
};

const PROPS = "bg|text|border|ring|from|to|via|fill|stroke|divide|placeholder|shadow|outline|decoration|accent|caret";
const FAMILIES = [...NEUTRALS, ...Object.keys(SEMANTIC)].join("|");
const RE = new RegExp(`\\b(${PROPS})-(${FAMILIES})-(\\d{2,3})(\\/\\d{1,3})?\\b`, "g");

function neutral(prop, shade) {
  const s = Number(shade);
  switch (prop) {
    case "text":
    case "placeholder":
    case "decoration":
      if (s >= 700) return "foreground";
      if (s >= 400) return "muted-foreground";
      return "muted-foreground/70";
    case "bg":
      if (s <= 200) return "surface-2";
      if (s >= 700) return "surface";
      return "muted";
    case "border":
    case "divide":
    case "outline":
    case "ring":
      return "border";
    case "from":
    case "to":
    case "via":
      return s >= 600 ? "surface" : "surface-2";
    case "fill":
    case "stroke":
      return s >= 700 ? "foreground" : "muted-foreground";
    default:
      return null;
  }
}

function semantic(prop, token, shade) {
  const s = Number(shade);
  switch (prop) {
    case "bg":
      if (s <= 100) return `${token}/10`;
      if (s <= 300) return `${token}/20`;
      return token;
    case "border":
    case "divide":
    case "outline":
      return s <= 300 ? `${token}/30` : token;
    case "text":
    case "ring":
    case "fill":
    case "stroke":
    case "from":
    case "to":
    case "via":
    case "shadow":
    case "accent":
    case "caret":
    case "placeholder":
    case "decoration":
      return token;
    default:
      return null;
  }
}

function convert(content) {
  let out = content.replace(RE, (full, prop, family, shade, alpha) => {
    let replacement;
    if (NEUTRALS.has(family)) replacement = neutral(prop, shade);
    else replacement = semantic(prop, SEMANTIC[family], shade);
    if (!replacement) return full;
    if (alpha) replacement = replacement.split("/")[0] + alpha;
    return `${prop}-${replacement}`;
  });

  // Hex da marca antiga
  out = out
    .replace(/\[#de4838\]/g, "primary")
    .replace(/\[#c73d2e\]/g, "primary/90")
    .replace(/\[#e5e7eb\]/g, "background");

  return out;
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (p.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

let changed = 0;
for (const file of walk("src")) {
  const original = fs.readFileSync(file, "utf8");
  const next = convert(original);
  if (next !== original) {
    fs.writeFileSync(file, next);
    changed++;
    console.log("  ajustado:", file);
  }
}
console.log(`Arquivos ajustados: ${changed}`);

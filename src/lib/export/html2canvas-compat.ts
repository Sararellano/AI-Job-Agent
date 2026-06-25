/**
 * html2canvas cannot parse modern CSS color functions (oklch, color-mix).
 * Tailwind v4 emits oklch in stylesheets — inline computed RGB styles on the clone instead.
 */
export function prepareHtml2CanvasClone(
  clonedDocument: Document,
  originalRoot: HTMLElement,
  clonedRoot: HTMLElement
): void {
  removeStylesheets(clonedDocument);
  inlineResolvedStyles(originalRoot, clonedRoot);
}

/** Inline browser-resolved styles without touching the live document stylesheets. */
export function inlineExportStyles(
  originalRoot: HTMLElement,
  clonedRoot: HTMLElement
): void {
  inlineResolvedStyles(originalRoot, clonedRoot);
}

function removeStylesheets(document: Document): void {
  document.querySelectorAll("style, link[rel='stylesheet']").forEach((node) => {
    node.remove();
  });
}

function inlineResolvedStyles(source: HTMLElement, target: HTMLElement): void {
  const computed = window.getComputedStyle(source);

  for (let i = 0; i < computed.length; i++) {
    const property = computed[i];
    let value = computed.getPropertyValue(property);
    if (!value) continue;

    if (isColorProperty(property) && containsUnsupportedColor(value)) {
      value = resolveColorToRgb(value);
    }

    if (containsUnsupportedColor(value)) continue;

    target.style.setProperty(property, value);
  }

  const sourceChildren = source.children;
  const targetChildren = target.children;

  for (let i = 0; i < sourceChildren.length; i++) {
    const sourceChild = sourceChildren[i];
    const targetChild = targetChildren[i];
    if (
      sourceChild instanceof HTMLElement &&
      targetChild instanceof HTMLElement
    ) {
      inlineResolvedStyles(sourceChild, targetChild);
    }
  }
}

const COLOR_PROPERTIES = new Set([
  "color",
  "background-color",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "column-rule-color",
  "caret-color",
  "fill",
  "stroke",
]);

function isColorProperty(property: string): boolean {
  return COLOR_PROPERTIES.has(property) || property.endsWith("-color");
}

function containsUnsupportedColor(value: string): boolean {
  return /oklch|color-mix|lab\(|lch\(/i.test(value);
}

function resolveColorToRgb(color: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return color;

  ctx.fillStyle = "#ffffff";
  ctx.fillStyle = color;
  return ctx.fillStyle;
}

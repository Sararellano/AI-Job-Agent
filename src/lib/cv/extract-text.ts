import mammoth from "mammoth";

const MAX_TEXT_LENGTH = 12000;

/**
 * Extracts plain text from a CV file buffer (PDF or DOCX).
 */
export async function extractTextFromCv(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const type = mimeType.toLowerCase();

  if (type.includes("pdf") || type === "application/octet-stream") {
    return extractPdfText(buffer);
  }

  if (
    type.includes("wordprocessingml") ||
    type.includes("msword") ||
    type.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error("Unsupported file type. Upload PDF or DOCX.");
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { CanvasFactory } = await import("pdf-parse/worker");
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer, CanvasFactory });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

export function truncateCvText(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= MAX_TEXT_LENGTH) return cleaned;
  return cleaned.slice(0, MAX_TEXT_LENGTH);
}

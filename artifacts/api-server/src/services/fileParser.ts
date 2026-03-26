import mammoth from "mammoth";
// Import from the lib path to bypass pdf-parse's index.js test-file loading at startup
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buffer: Buffer, options?: Record<string, unknown>) => Promise<{ text: string; numpages: number }> =
  require("pdf-parse/lib/pdf-parse.js");

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  const text = data.text?.trim();
  if (!text || text.length < 20) {
    throw new Error(
      "Could not extract readable text from this PDF. Try converting to DOCX or paste the text manually.",
    );
  }
  return text;
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimetype: string,
  originalname: string,
): Promise<string> {
  const ext = originalname.toLowerCase().split(".").pop();

  if (mimetype === "application/pdf" || ext === "pdf") {
    return extractTextFromPdf(buffer);
  }

  if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword" ||
    ext === "docx" ||
    ext === "doc"
  ) {
    return extractTextFromDocx(buffer);
  }

  if (mimetype === "text/plain" || ext === "txt") {
    return buffer.toString("utf-8");
  }

  throw new Error(`Unsupported file type: ${mimetype} (${ext})`);
}

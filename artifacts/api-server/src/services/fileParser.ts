import mammoth from "mammoth";

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // pdf-parse handles Node.js compatibility (DOMMatrix, canvas polyfills etc.)
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  const text = data.text?.trim();
  if (!text || text.length < 20) {
    throw new Error("Could not extract readable text from this PDF. Try a DOCX version instead.");
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
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
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

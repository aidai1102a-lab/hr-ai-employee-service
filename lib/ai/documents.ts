import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import mammoth from "mammoth";
import pdf from "pdf-parse";
import * as XLSX from "xlsx";

export async function fileChecksum(filePath: string) {
  const data = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

export async function extractText(filePath: string, mimeType: string) {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = await fs.readFile(filePath);

  if (mimeType.includes("pdf") || ext === ".pdf") {
    const parsed = await pdf(buffer);
    return parsed.text;
  }

  if (mimeType.includes("word") || ext === ".docx") {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value;
  }

  if (mimeType.includes("spreadsheet") || [".xlsx", ".xls", ".csv"].includes(ext)) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    return workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      return [`# ${sheetName}`, ...rows.map((row) => JSON.stringify(row))].join("\n");
    }).join("\n\n");
  }

  return buffer.toString("utf8");
}


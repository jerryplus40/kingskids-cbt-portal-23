// SheetJS is ~400 kB, so it loads only when a spreadsheet is actually read or written
const loadXlsx = () => import('xlsx');

export type RawRow = Record<string, string>;

/** Header text → snake_case key, so "Admission No" and "admission_no" both match. */
export const normaliseHeader = (header: string) =>
  header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/** Reads the first sheet of an .xlsx, .xls or .csv file into rows of trimmed strings. */
export async function readSpreadsheet(file: File): Promise<RawRow[]> {
  const XLSX = await loadXlsx();
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false, dateNF: 'yyyy-mm-dd' });
  return rows
    .map((row) =>
      Object.fromEntries(Object.entries(row).map(([key, value]) => [normaliseHeader(key), String(value ?? '').trim()])),
    )
    .filter((row) => Object.values(row).some((value) => value !== ''));
}

/** Downloads rows as an .xlsx file. */
export async function downloadSpreadsheet(fileName: string, rows: Record<string, unknown>[], sheetName = 'Sheet1') {
  const XLSX = await loadXlsx();
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), sheetName);
  XLSX.writeFile(workbook, fileName);
}

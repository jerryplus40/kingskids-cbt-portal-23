import { useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileUp, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { downloadSpreadsheet, readSpreadsheet, type RawRow } from '@/lib/spreadsheet';

export interface ParsedRow<T> {
  /** Row number as the person sees it in their spreadsheet (header is row 1) */
  line: number;
  raw: RawRow;
  value: T | null;
  errors: string[];
  warnings: string[];
}

export interface ImportOutcome {
  imported: number;
  failed: { line: number; error: string }[];
}

interface ImportWizardProps<T> {
  /** Shown above the file picker */
  instructions: ReactNode;
  templateFileName: string;
  templateRows: Record<string, string | number>[];
  /** Converts and validates every row; can look across rows (for duplicates) */
  parse: (rows: RawRow[]) => ParsedRow<T>[];
  /** Preview columns: header and how to show a parsed row */
  previewColumns: { header: string; cell: (row: ParsedRow<T>) => ReactNode }[];
  /** Imports the valid rows; may report progress from 0 to 1 */
  onImport: (rows: ParsedRow<T>[], onProgress: (fraction: number) => void) => Promise<ImportOutcome>;
  /** Accepted file types; defaults to spreadsheets */
  accept?: string;
  /** Custom reader for non-spreadsheet formats (e.g. Word) */
  readFile?: (file: File) => Promise<RawRow[]>;
  onDone?: () => void;
}

type Step = 'pick' | 'preview' | 'importing' | 'done';

/** Upload → validate → preview → confirm, shared by every bulk import in the app. */
export function ImportWizard<T>({
  instructions,
  templateFileName,
  templateRows,
  parse,
  previewColumns,
  onImport,
  accept = '.xlsx,.xls,.csv',
  readFile = readSpreadsheet,
  onDone,
}: ImportWizardProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('pick');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow<T>[]>([]);
  const [readError, setReadError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);

  const valid = useMemo(() => rows.filter((r) => r.value && r.errors.length === 0), [rows]);
  const invalid = rows.length - valid.length;
  const withWarnings = valid.filter((r) => r.warnings.length > 0).length;
  const shown = showOnlyProblems ? rows.filter((r) => r.errors.length || r.warnings.length) : rows;

  const handleFile = async (file: File) => {
    setReadError(null);
    setFileName(file.name);
    try {
      const raw = await readFile(file);
      if (raw.length === 0) {
        setReadError('The file has no rows. Check that the first sheet holds the data, with headers in row 1.');
        return;
      }
      if (raw.length > 2000) {
        setReadError(`The file has ${raw.length} rows. Split it into files of at most 2,000 rows.`);
        return;
      }
      setRows(parse(raw));
      setStep('preview');
    } catch (error) {
      setReadError(`Could not read ${file.name}: ${(error as Error).message}`);
    }
  };

  const runImport = async () => {
    setStep('importing');
    setProgress(0);
    try {
      setOutcome(await onImport(valid, setProgress));
    } catch (error) {
      setOutcome({ imported: 0, failed: [{ line: 0, error: (error as Error).message }] });
    }
    setStep('done');
  };

  const downloadErrors = () =>
    downloadSpreadsheet(
      `errors-${fileName.replace(/\.[^.]+$/, '')}.xlsx`,
      rows.filter((r) => r.errors.length).map((r) => ({ row: r.line, problems: r.errors.join('; '), ...r.raw })),
    );

  const reset = () => {
    setStep('pick');
    setRows([]);
    setOutcome(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (step === 'pick') {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">{instructions}</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadSpreadsheet(templateFileName, templateRows)}>
            <Download className="mr-2 h-4 w-4" /> Download template
          </Button>
          <Button onClick={() => inputRef.current?.click()}>
            <FileUp className="mr-2 h-4 w-4" /> Choose file
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
        {readError && (
          <Alert variant="destructive">
            <AlertDescription>{readError}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  if (step === 'importing') {
    return (
      <div className="space-y-3 py-6">
        <p className="text-sm">Importing {valid.length} rows… keep this window open.</p>
        <Progress value={progress * 100} />
      </div>
    );
  }

  if (step === 'done' && outcome) {
    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Imported {outcome.imported} of {valid.length} rows from {fileName}.
          </AlertDescription>
        </Alert>
        {outcome.failed.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-destructive">{outcome.failed.length} rows failed:</p>
            <ul className="max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-sm">
              {outcome.failed.map((f, i) => (
                <li key={i}>{f.line ? `Row ${f.line}: ` : ''}{f.error}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>
            Import another file
          </Button>
          {onDone && <Button onClick={onDone}>Done</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{fileName}</span>
        <Badge variant="secondary">{rows.length} rows</Badge>
        <Badge className="bg-green-600 hover:bg-green-600">{valid.length} ready</Badge>
        {withWarnings > 0 && <Badge className="bg-amber-500 hover:bg-amber-500">{withWarnings} with warnings</Badge>}
        {invalid > 0 && <Badge variant="destructive">{invalid} with errors</Badge>}
        <label className="ml-auto flex items-center gap-2 text-muted-foreground">
          <input type="checkbox" checked={showOnlyProblems} onChange={(e) => setShowOnlyProblems(e.target.checked)} />
          Show only rows with problems
        </label>
      </div>
      <div className="max-h-[50vh] overflow-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead className="w-12">Row</TableHead>
              <TableHead className="w-10" />
              {previewColumns.map((c) => (
                <TableHead key={c.header}>{c.header}</TableHead>
              ))}
              <TableHead>Problems</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((row) => (
              <TableRow key={row.line} className={row.errors.length ? 'bg-destructive/5' : undefined}>
                <TableCell className="text-muted-foreground">{row.line}</TableCell>
                <TableCell>
                  {row.errors.length ? (
                    <XCircle className="h-4 w-4 text-destructive" aria-label="Error" />
                  ) : row.warnings.length ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" aria-label="Warning" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Ready" />
                  )}
                </TableCell>
                {previewColumns.map((c) => (
                  <TableCell key={c.header} className="max-w-xs truncate">
                    {c.cell(row)}
                  </TableCell>
                ))}
                <TableCell className="text-xs">
                  {row.errors.map((e) => (
                    <div key={e} className="text-destructive">{e}</div>
                  ))}
                  {row.warnings.map((w) => (
                    <div key={w} className="text-amber-600">{w}</div>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={reset}>
          Choose a different file
        </Button>
        {invalid > 0 && (
          <Button variant="outline" onClick={downloadErrors}>
            <Download className="mr-2 h-4 w-4" /> Download rows with errors
          </Button>
        )}
        <Button onClick={runImport} disabled={valid.length === 0}>
          Import {valid.length} {valid.length === 1 ? 'row' : 'rows'}
        </Button>
      </div>
      {invalid > 0 && <p className="text-xs text-muted-foreground">Rows with errors are skipped. Fix them in the file and import it again.</p>}
    </div>
  );
}

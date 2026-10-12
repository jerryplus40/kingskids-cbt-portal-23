import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { ImportWizard, type ParsedRow } from '@/components/ImportWizard';
import { RichText } from '@/components/RichText';
import { useSubjects } from '@/hooks/useReferenceData';
import { supabase, unwrap } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';
import { loadKatex } from '@/lib/richtext';
import type { RawRow } from '@/lib/spreadsheet';
import { useImports } from '@/features/questions/queries';
import { QUESTION_TEMPLATE, docLinesToRows, parseQuestionRows } from '@/features/questions/parseQuestions';
import { readWordDocument } from '@/features/questions/readWord';
import type { ImportPassage, ImportQuestion } from '@/features/questions/types';

const normalise = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');

const WORD_EXAMPLE = `1. What is 5 × 3?
A. 8
B. 15
C. 53
D. 35
Answer: B
Marks: 1

2. Explain two causes of soil erosion.
Marks: 4`;

export default function QuestionImport() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: subjects } = useSubjects();
  const imports = useImports();
  const existing = useQuery({
    queryKey: ['question_texts'],
    queryFn: async () => new Set((unwrap(await supabase.from('questions').select('body').limit(20000)) as { body: string }[]).map((q) => normalise(q.body))),
  });

  // Images live in a ref: the Word reader fills it just before parse() runs, before any re-render
  const imagesRef = useRef<Map<string, Blob>>(new Map());
  const [imageCount, setImageCount] = useState(0);
  const setImages = (images: Map<string, Blob>) => {
    imagesRef.current = images;
    setImageCount(images.size);
  };
  const [wordSubject, setWordSubject] = useState('');
  const passagesRef = useRef<Record<string, ImportPassage>>({});
  // The importer checks maths in every row, which needs KaTeX
  useEffect(() => void loadKatex(), []);
  const fileNameRef = useRef('questions');

  const parse = (rows: RawRow[], defaultSubjectId?: string) => {
    const { rows: parsed, passages } = parseQuestionRows(rows, {
      subjects: subjects ?? [],
      defaultSubjectId,
      existingTexts: existing.data ?? new Set(),
      imageFiles: new Set(imagesRef.current.keys()),
    });
    passagesRef.current = passages;
    return parsed;
  };

  const runImport = async (rows: ParsedRow<ImportQuestion>[], onProgress: (f: number) => void) => {
    // Upload each image once, then point the questions at the public URLs
    const needed = new Set(rows.flatMap((r) => [r.value!.imageFile, ...Object.values(r.value!.optionImageFiles ?? {})].filter(Boolean) as string[]));
    const urls = new Map<string, string>();
    let done = 0;
    for (const name of needed) {
      const blob = imagesRef.current.get(name);
      if (blob) urls.set(name, await uploadImage('question-media', blob, name));
      onProgress((++done / Math.max(needed.size, 1)) * 0.8);
    }
    const payload = rows.map(({ value }) => {
      const { imageFile, optionImageFiles, ...question } = value!;
      return {
        ...question,
        image_url: imageFile ? urls.get(imageFile) : question.image_url,
        options: question.options.map((o) => ({ ...o, image_url: optionImageFiles?.[o.label] ? urls.get(optionImageFiles[o.label]!) : o.image_url })),
      };
    });
    const { data: importId, error } = await supabase.rpc('import_questions', {
      p_file_name: fileNameRef.current,
      p_rows: payload,
      p_passages: passagesRef.current,
    });
    onProgress(1);
    if (error) return { imported: 0, failed: [{ line: 0, error: error.message }] };
    queryClient.invalidateQueries({ queryKey: ['questions'] });
    queryClient.invalidateQueries({ queryKey: ['question_imports'] });
    queryClient.invalidateQueries({ queryKey: ['question_texts'] });
    toast.success(`${rows.length} questions imported as drafts. Review and approve them.`);
    navigate(`/staff/questions?import=${importId}&status=draft`);
    return { imported: rows.length, failed: [] };
  };

  const undo = async (id: string, fileName: string) => {
    if (!window.confirm(`Delete every question imported from ${fileName}?`)) return;
    const { data, error } = await supabase.rpc('undo_import', { p_import_id: id });
    if (error) {
      toast.error(error.message.includes('foreign key') ? 'Some of these questions are used in an exam, so the import cannot be undone.' : error.message);
      return;
    }
    toast.success(`Removed ${data} questions`);
    queryClient.invalidateQueries({ queryKey: ['question_imports'] });
    queryClient.invalidateQueries({ queryKey: ['questions'] });
  };

  const previewColumns = [
    { header: 'Subject', cell: (r: ParsedRow<ImportQuestion>) => subjects?.find((s) => s.id === r.value?.subject_id)?.name ?? r.raw.subject },
    { header: 'Question', cell: (r: ParsedRow<ImportQuestion>) => <RichText text={(r.raw.question ?? '').slice(0, 120)} className="line-clamp-2" /> },
    { header: 'Type', cell: (r: ParsedRow<ImportQuestion>) => (r.value?.type ?? r.raw.type ?? 'mcq').toUpperCase() },
    { header: 'Answer', cell: (r: ParsedRow<ImportQuestion>) => r.raw.answer?.toUpperCase() },
    { header: 'Marks', cell: (r: ParsedRow<ImportQuestion>) => r.raw.marks || '1' },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/staff/questions"><ArrowLeft className="mr-2 h-4 w-4" />Question bank</Link>
      </Button>
      <PageHeader title="Import questions" description="Bring in a whole paper at once. Imported questions arrive as drafts for you to review and approve." />

      <Tabs defaultValue="excel">
        <TabsList>
          <TabsTrigger value="excel">Excel or CSV</TabsTrigger>
          <TabsTrigger value="word">Word document</TabsTrigger>
        </TabsList>

        <TabsContent value="excel" className="mt-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1">
                <Label htmlFor="images">Images used in the spreadsheet (optional)</Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => setImages(new Map([...(e.target.files ?? [])].map((f) => [f.name.toLowerCase(), f])))}
                />
                <p className="text-xs text-muted-foreground">
                  Choose these first. In the image column, write the file name (e.g. graph1.png). {imageCount > 0 && `${imageCount} chosen.`}
                </p>
              </div>
              <ImportWizard<ImportQuestion>
                instructions={
                  <>
                    One question per row. Write maths between dollar signs, e.g. <code>$\frac{'{1}{2}'}$</code>. For a
                    comprehension, give each question the same passage_id and put the passage text in the passage column of the
                    first one. Leave the options empty for theory questions.
                  </>
                }
                templateFileName="questions-template.xlsx"
                templateRows={QUESTION_TEMPLATE}
                parse={(rows) => parse(rows)}
                readFile={async (file) => {
                  fileNameRef.current = file.name;
                  const { readSpreadsheet } = await import('@/lib/spreadsheet');
                  return readSpreadsheet(file);
                }}
                previewColumns={previewColumns}
                onImport={runImport}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="word" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Word layout</CardTitle>
              <CardDescription>Number each question, letter the options, and add an Answer line. Pictures in the document come along.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="rounded bg-muted p-3 text-xs">{WORD_EXAMPLE}</pre>
              <div className="space-y-1">
                <Label>Subject for this document</Label>
                <Select value={wordSubject} onValueChange={setWordSubject}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Choose subject" /></SelectTrigger>
                  <SelectContent>{subjects?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {wordSubject && (
                <ImportWizard<ImportQuestion>
                  instructions="Choose a .docx file. Older .doc files must be saved as .docx first."
                  templateFileName="questions-template.xlsx"
                  templateRows={QUESTION_TEMPLATE}
                  accept=".docx"
                  readFile={async (file) => {
                    fileNameRef.current = file.name;
                    const doc = await readWordDocument(file);
                    setImages(doc.images);
                    return docLinesToRows(doc.lines);
                  }}
                  parse={(rows) => parse(rows, wordSubject)}
                  previewColumns={previewColumns}
                  onImport={runImport}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent imports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>When</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.data?.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <Link to={`/staff/questions?import=${i.id}`} className="text-primary hover:underline">{i.file_name}</Link>
                  </TableCell>
                  <TableCell>{i.row_count}</TableCell>
                  <TableCell>{new Date(i.created_at).toLocaleString('en-NG')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => undo(i.id, i.file_name)}>
                      <Undo2 className="mr-1 h-4 w-4" />Undo
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {imports.data?.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">No imports yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

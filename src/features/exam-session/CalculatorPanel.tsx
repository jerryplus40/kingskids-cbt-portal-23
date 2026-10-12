import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initialCalc, pressKey, type CalcKey } from './calculator';

const KEYS: CalcKey[][] = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['±', '0', '.', '='],
];

export function CalculatorPanel({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState(initialCalc);
  const press = (key: CalcKey) => setState((s) => pressKey(s, key));
  return (
    <div className="fixed bottom-4 right-4 z-50 w-64 rounded-lg border bg-background p-3 shadow-xl" role="dialog" aria-label="Calculator">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">Calculator</span>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose} aria-label="Close calculator"><X className="h-4 w-4" /></Button>
      </div>
      <div className="mb-2 truncate rounded bg-muted px-3 py-2 text-right font-mono text-2xl" aria-live="polite">{state.display}</div>
      <div className="grid grid-cols-4 gap-1">
        {KEYS.flat().map((key) => (
          <Button key={key} variant={/[\d.]/.test(key) ? 'outline' : 'secondary'} className="h-10 text-base" onClick={() => press(key)}>
            {key}
          </Button>
        ))}
        <Button variant="secondary" className="col-span-4 h-9" onClick={() => press('√')}>√ square root</Button>
      </div>
    </div>
  );
}

/** A basic four-function calculator, button by button, like the one in the UTME interface. */
export interface CalcState {
  display: string;
  stored: number | null;
  operator: Operator | null;
  fresh: boolean; // the next digit starts a new number
}

export type Operator = '+' | '−' | '×' | '÷';
export type CalcKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | Operator | '=' | 'C' | '±' | '%' | '√' | '⌫';

export const initialCalc: CalcState = { display: '0', stored: null, operator: null, fresh: true };

const apply = (a: number, b: number, op: Operator) => {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? NaN : a / b;
  }
};

const show = (value: number) => {
  if (!Number.isFinite(value)) return 'Error';
  // Trim floating-point noise such as 0.1 + 0.2 = 0.30000000000000004
  return String(Number.parseFloat(value.toPrecision(12)));
};

export function pressKey(state: CalcState, key: CalcKey): CalcState {
  const current = Number.parseFloat(state.display);
  if (state.display === 'Error' && key !== 'C') return state;

  if (/^\d$/.test(key)) {
    if (state.fresh || state.display === '0') return { ...state, display: key, fresh: false };
    if (state.display.replace(/[-.]/g, '').length >= 12) return state;
    return { ...state, display: state.display + key };
  }
  switch (key) {
    case '.':
      if (state.fresh) return { ...state, display: '0.', fresh: false };
      return state.display.includes('.') ? state : { ...state, display: `${state.display}.` };
    case 'C':
      return initialCalc;
    case '⌫':
      if (state.fresh) return state;
      return { ...state, display: state.display.length > 1 ? state.display.slice(0, -1) : '0' };
    case '±':
      return { ...state, display: show(-current) };
    case '%':
      return { ...state, display: show(current / 100), fresh: true };
    case '√':
      return { ...state, display: current < 0 ? 'Error' : show(Math.sqrt(current)), fresh: true };
    case '=':
      if (state.operator === null || state.stored === null) return { ...state, fresh: true };
      return { display: show(apply(state.stored, current, state.operator)), stored: null, operator: null, fresh: true };
    default: {
      // An operator: chain the pending calculation first (2 + 3 × → 5 ×)
      const op = key as Operator;
      if (state.operator && state.stored !== null && !state.fresh) {
        const result = apply(state.stored, current, state.operator);
        return { display: show(result), stored: result, operator: op, fresh: true };
      }
      return { ...state, stored: current, operator: op, fresh: true };
    }
  }
}

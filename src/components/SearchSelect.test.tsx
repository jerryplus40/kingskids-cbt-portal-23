// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchSelect } from './SearchSelect';

beforeAll(() => {
  // jsdom lacks these; cmdk and Radix call them
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never;
  Element.prototype.scrollIntoView ??= () => {};
  Element.prototype.hasPointerCapture ??= () => false;
});

afterEach(cleanup);

const subjects = [
  { value: 'bio', label: 'Biology' },
  { value: 'mth', label: 'Mathematics' },
  { value: 'phy', label: 'Physics' },
];

describe('SearchSelect', () => {
  it('narrows the list as you type and picks the match', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchSelect options={subjects} value="" onChange={onChange} placeholder="Choose subject" />);
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Type to search…'), 'mat');
    expect(screen.queryByText('Biology')).toBeNull();
    expect(screen.queryByText('Physics')).toBeNull();
    await user.click(screen.getByText('Mathematics'));
    expect(onChange).toHaveBeenCalledWith('mth');
  });

  it('shows the chosen label and a message when nothing matches', async () => {
    const user = userEvent.setup();
    render(<SearchSelect options={subjects} value="phy" onChange={() => {}} emptyText="No subject matches." />);
    expect(screen.getByRole('combobox').textContent).toContain('Physics');
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Type to search…'), 'zzz');
    expect(screen.getByText('No subject matches.')).toBeTruthy();
  });
});

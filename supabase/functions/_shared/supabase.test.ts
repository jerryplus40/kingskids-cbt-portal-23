import { tempPassword } from './supabase.ts';

Deno.test('temporary passwords always meet the Supabase policy', () => {
  for (let i = 0; i < 5000; i++) {
    const p = tempPassword();
    if (!/^kk-[A-Za-z2-9]{4}-[A-Za-z2-9]{4}$/.test(p) || !/[a-z]/.test(p.slice(3)) || !/[A-Z]/.test(p) || !/\d/.test(p) || p.length < 8) {
      throw new Error(`bad password ${p}`);
    }
  }
});

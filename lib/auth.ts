import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const COOKIE = 'admin_session';
const WEEK = 60 * 60 * 24 * 7;

/** In development the password defaults to "admin". In production ADMIN_PASSWORD must be set. */
export function adminPassword(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.NODE_ENV === 'production' ? null : 'admin';
}

const sign = (value: string, secret: string) =>
  createHmac('sha256', secret).update(value).digest('hex');

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(input: string): boolean {
  const pw = adminPassword();
  if (!pw) return false;
  // compare digests so length differences don't leak
  return safeEqual(sign(input, 'pw'), sign(pw, 'pw'));
}

export function createToken(): { value: string; maxAge: number } {
  const exp = String(Math.floor(Date.now() / 1000) + WEEK);
  return { value: `${exp}.${sign(exp, adminPassword()!)}`, maxAge: WEEK };
}

export async function isAdmin(): Promise<boolean> {
  const pw = adminPassword();
  if (!pw) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, sign(exp, pw));
}

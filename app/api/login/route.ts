import { NextResponse } from 'next/server';
import { adminPassword, checkPassword, createToken, COOKIE } from '@/lib/auth';

export async function POST(req: Request) {
  if (!adminPassword()) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD is not set. Add it in Vercel → Settings → Environment Variables, then redeploy.' },
      { status: 500 }
    );
  }
  const { password } = await req.json().catch(() => ({ password: '' }));
  if (typeof password !== 'string' || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }
  const token = createToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token.value, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: token.maxAge,
  });
  return res;
}

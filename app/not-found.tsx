import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="case-head" style={{ minHeight: '100svh', justifyContent: 'center' }}>
      <h1 className="display">Page not found</h1>
      <p className="lede">That page doesn’t exist, or the project was removed.</p>
      <Link className="pill pill--accent" href="/">
        Back to home
      </Link>
    </main>
  );
}

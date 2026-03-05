import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "GST Easy — Simple GST for Indian Businesses",
  description: "Create invoices, scan purchase bills, and track your GST — no CA needed for the routine stuff.",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#6366f1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <header className="app-header">
          <span className="app-header-title">GST Easy</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-ghost" style={{ position: 'relative', padding: '6px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#ef4444', border: '2px solid white'
              }} />
            </button>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '14px', fontWeight: '700'
            }}>R</div>
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}

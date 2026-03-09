import PublicPageLayout from '@/components/PublicPageLayout';

export default function ApiDocsPage() {
    const endpoints = [
        { method: 'POST', path: '/api/v1/auth/register', desc: 'Register new user account' },
        { method: 'POST', path: '/api/v1/auth/login', desc: 'Authenticate and get JWT token' },
        { method: 'GET', path: '/api/v1/invoices', desc: 'List all invoices (paginated)' },
        { method: 'POST', path: '/api/v1/invoices', desc: 'Create a new sales invoice' },
        { method: 'POST', path: '/api/v1/bills/upload', desc: 'Upload bill for OCR processing' },
        { method: 'GET', path: '/api/v1/gst/summary', desc: 'Get GST liability summary' },
        { method: 'GET', path: '/api/v1/products', desc: 'List all products' },
        { method: 'POST', path: '/api/v1/ai/chat', desc: 'AI chat for business queries' },
        { method: 'GET', path: '/api/v1/analytics/summary', desc: 'Dashboard summary data' },
        { method: 'GET', path: '/api/v1/reports/csv', desc: 'Export invoices as CSV' },
    ];

    const methodColors: Record<string, string> = { GET: 'bg-blue-100 text-blue-700', POST: 'bg-emerald-100 text-emerald-700', PUT: 'bg-amber-100 text-amber-700', DELETE: 'bg-red-100 text-red-700' };

    return (
        <PublicPageLayout>
            <div className="max-w-5xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <span className="text-sm font-bold text-[#10a24b] bg-[#10a24b]/10 px-3 py-1 rounded-full uppercase tracking-wider">Developer Docs</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-6">GSTFlow API Reference</h1>
                    <p className="text-lg text-slate-500 mt-4">Build custom integrations with our RESTful API. Authentication via JWT Bearer tokens.</p>
                </div>

                <div className="bg-slate-900 rounded-xl p-6 mb-10">
                    <p className="text-sm text-slate-400 mb-2">Base URL</p>
                    <code className="text-[#10a24b] font-mono text-lg">https://api.gstflow.in/api/v1</code>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200"><h2 className="text-lg font-bold text-slate-900">Endpoints</h2></div>
                    <div className="divide-y divide-slate-100">
                        {endpoints.map((e, i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${methodColors[e.method]}`}>{e.method}</span>
                                <code className="text-sm font-mono text-slate-900 flex-1">{e.path}</code>
                                <span className="text-sm text-slate-500">{e.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-10 bg-[#10a24b]/5 border border-[#10a24b]/20 rounded-xl p-6">
                    <h3 className="text-base font-bold text-slate-900 mb-2">Authentication</h3>
                    <p className="text-sm text-slate-600 mb-3">All API endpoints (except auth) require a Bearer token in the Authorization header:</p>
                    <code className="text-sm font-mono bg-slate-900 text-[#10a24b] px-4 py-2 rounded-lg block">Authorization: Bearer &lt;your_jwt_token&gt;</code>
                </div>
            </div>
        </PublicPageLayout>
    );
}

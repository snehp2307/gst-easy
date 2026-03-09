import PublicPageLayout from '@/components/PublicPageLayout';

export default function CookiePolicyPage() {
    return (
        <PublicPageLayout>
            <div className="max-w-3xl mx-auto px-6 py-20">
                <span className="text-sm font-bold text-[#10a24b] bg-[#10a24b]/10 px-3 py-1 rounded-full uppercase tracking-wider">Legal</span>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-6">Cookie Policy</h1>
                <p className="text-sm text-slate-500 mt-2">Last updated: March 1, 2026</p>

                <div className="mt-10 space-y-8 text-sm text-slate-700 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">What Are Cookies</h2>
                        <p>Cookies are small text files stored on your device when you visit our website. They help us remember your preferences and improve your experience.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">Cookies We Use</h2>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-4">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Cookie</th><th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Purpose</th><th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Duration</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr><td className="px-4 py-3 font-mono text-xs">gst_token</td><td className="px-4 py-3">Authentication</td><td className="px-4 py-3">24 hours</td></tr>
                                    <tr><td className="px-4 py-3 font-mono text-xs">gst_user</td><td className="px-4 py-3">User session info</td><td className="px-4 py-3">24 hours</td></tr>
                                    <tr><td className="px-4 py-3 font-mono text-xs">_ga</td><td className="px-4 py-3">Google Analytics</td><td className="px-4 py-3">2 years</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">Managing Cookies</h2>
                        <p>You can disable cookies through your browser settings. Note that disabling essential cookies (gst_token, gst_user) will prevent you from logging into GSTFlow.</p>
                    </section>
                </div>
            </div>
        </PublicPageLayout>
    );
}

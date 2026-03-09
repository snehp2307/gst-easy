import PublicPageLayout from '@/components/PublicPageLayout';

export default function PrivacyPolicyPage() {
    return (
        <PublicPageLayout>
            <div className="max-w-3xl mx-auto px-6 py-20">
                <span className="text-sm font-bold text-[#10a24b] bg-[#10a24b]/10 px-3 py-1 rounded-full uppercase tracking-wider">Legal</span>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-6">Privacy Policy</h1>
                <p className="text-sm text-slate-500 mt-2">Last updated: March 1, 2026</p>

                <div className="mt-10 space-y-8 text-sm text-slate-700 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">1. Information We Collect</h2>
                        <p>We collect information you provide directly — your name, phone number, email, business details (GSTIN, PAN, address), and financial data (invoices, bills, payments) you input into GSTFlow.</p>
                        <p className="mt-2">We also collect usage data such as device information, browser type, IP address, and feature interaction patterns to improve our service.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">2. How We Use Your Information</h2>
                        <ul className="space-y-2 list-disc list-inside">
                            <li>To provide and maintain the GSTFlow platform</li>
                            <li>To process invoices, calculate GST, and generate reports</li>
                            <li>To power AI features (bill scanning, chat, predictions)</li>
                            <li>To send service notifications and filing reminders</li>
                            <li>To improve our algorithms and user experience</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">3. Data Security</h2>
                        <p>All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We use Supabase PostgreSQL with row-level security. Backups are maintained in AWS ap-south-1 (Mumbai) region. We undergo regular security audits.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">4. Data Sharing</h2>
                        <p>We do not sell your data. We share data only with: (a) Supabase for database hosting, (b) Render for application hosting, (c) law enforcement when legally required, (d) AI processing services for OCR and insights (data is anonymized).</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">5. Your Rights</h2>
                        <p>You can export all your data at any time from Settings. You can request account deletion by contacting support@gstflow.in. We will delete all personal data within 30 days of request, subject to legal retention requirements.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">6. Contact</h2>
                        <p>For privacy concerns, contact us at <a href="mailto:privacy@gstflow.in" className="text-[#10a24b]">privacy@gstflow.in</a> or write to: GSTFlow Technologies Pvt Ltd, HSR Layout, Bangalore 560102.</p>
                    </section>
                </div>
            </div>
        </PublicPageLayout>
    );
}

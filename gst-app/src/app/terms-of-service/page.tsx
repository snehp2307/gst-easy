import PublicPageLayout from '@/components/PublicPageLayout';

export default function TermsOfServicePage() {
    return (
        <PublicPageLayout>
            <div className="max-w-3xl mx-auto px-6 py-20">
                <span className="text-sm font-bold text-[#10a24b] bg-[#10a24b]/10 px-3 py-1 rounded-full uppercase tracking-wider">Legal</span>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-6">Terms of Service</h1>
                <p className="text-sm text-slate-500 mt-2">Last updated: March 1, 2026</p>

                <div className="mt-10 space-y-8 text-sm text-slate-700 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
                        <p>By accessing and using GSTFlow (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you are using the Service on behalf of a business, you represent that you have authority to bind that business.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">2. Description of Service</h2>
                        <p>GSTFlow is a SaaS platform providing AI-powered GST automation, invoice management, bill scanning, compliance tracking, and business analytics for Indian businesses under the Goods and Services Tax regime.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">3. User Accounts</h2>
                        <p>You must provide accurate information during registration. You are responsible for maintaining the security of your account credentials. You must notify us immediately of any unauthorized access.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">4. Billing and Payment</h2>
                        <p>Subscription fees are billed monthly or annually as per your chosen plan. All prices are in Indian Rupees (INR) and exclude applicable GST (18%). You may cancel at any time; access continues until the end of the billing period.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">5. Data Accuracy</h2>
                        <p>While GSTFlow uses AI to automate calculations, you are solely responsible for verifying the accuracy of GST calculations, invoice data, and filing information before submission to authorities. GSTFlow is a tool to assist — not a substitute for professional tax advice.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">6. Limitation of Liability</h2>
                        <p>GSTFlow shall not be liable for any indirect, incidental, or consequential damages arising from use of the Service, including but not limited to penalties from incorrect GST filings. Our total liability is limited to the amount you paid in the 12 months preceding the claim.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">7. Governing Law</h2>
                        <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.</p>
                    </section>
                </div>
            </div>
        </PublicPageLayout>
    );
}

'use client';

export default function ReportsPage() {
    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Reports</h2>
                <p style={{ color: '#64748b', marginTop: '4px' }}>Generate and download reports</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
                    <div className="stat-icon green" style={{ margin: '0 auto 16px' }}>
                        <span className="material-symbols-outlined">description</span>
                    </div>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>Invoice Report</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>CSV export of all invoices</p>
                    <button className="btn-outline" style={{ width: '100%' }}>Download CSV</button>
                </div>

                <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
                    <div className="stat-icon green" style={{ margin: '0 auto 16px' }}>
                        <span className="material-symbols-outlined">account_balance</span>
                    </div>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>GST Summary</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Period-wise GST report</p>
                    <button className="btn-outline" style={{ width: '100%' }}>Download JSON</button>
                </div>

                <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
                    <div className="stat-icon green" style={{ margin: '0 auto 16px' }}>
                        <span className="material-symbols-outlined">picture_as_pdf</span>
                    </div>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>PDF Reports</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Download invoice PDFs</p>
                    <button className="btn-outline" style={{ width: '100%' }}>Generate PDF</button>
                </div>
            </div>
        </div>
    );
}

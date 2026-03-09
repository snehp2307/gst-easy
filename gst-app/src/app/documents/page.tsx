'use client';

import { useState, useRef, useEffect } from 'react';
import { uploadDocument, listDocuments, type DocumentItem } from '@/lib/api';

export default function DocumentsPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [docs, setDocs] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const fileRef = useRef<HTMLInputElement>(null);

    const loadDocs = () => {
        listDocuments().then(setDocs).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(() => { loadDocs(); }, []);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    };

    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    };

    const handleUpload = async () => {
        setUploading(true);
        for (const f of files) {
            try {
                await uploadDocument(f, f.name.endsWith('.pdf') ? 'invoice' : 'bill');
            } catch { }
        }
        setFiles([]);
        setUploading(false);
        loadDocs();
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Document Upload</h2>
                <p className="text-slate-500 mt-1">Upload invoices or bills for AI-powered data extraction</p>
            </div>

            {/* Upload Area */}
            <div onDragOver={e => e.preventDefault()} onDrop={handleDrop} onClick={() => fileRef.current?.click()} className="bg-white border-2 border-dashed border-slate-300 hover:border-[#10a24b] rounded-2xl p-12 text-center cursor-pointer transition-colors group">
                <input ref={fileRef} type="file" onChange={handleSelect} accept="image/*,.pdf" multiple className="hidden" />
                <div className="w-16 h-16 mx-auto bg-[#10a24b]/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#10a24b]/20 transition-colors">
                    <span className="material-symbols-outlined text-[#10a24b] text-3xl">cloud_upload</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Drop files here or click to upload</h3>
                <p className="text-sm text-slate-500 mb-4">Supports JPG, PNG, PDF — Max 10MB per file</p>
                <button className="px-6 py-2.5 bg-[#10a24b] text-white text-sm font-semibold rounded-lg hover:bg-[#10a24b]/90 transition-colors">Select Files</button>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Selected Files ({files.length})</h3>
                    {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                            <span className="material-symbols-outlined text-[#10a24b]">description</span>
                            <div className="flex-1"><p className="text-sm font-medium text-slate-900">{f.name}</p><p className="text-xs text-slate-500">{(f.size / 1024).toFixed(0)} KB</p></div>
                            <button onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, j) => j !== i)); }} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-lg">close</span></button>
                        </div>
                    ))}
                    <button onClick={handleUpload} disabled={uploading} className="w-full py-3 bg-[#10a24b] text-white rounded-lg font-bold text-sm hover:bg-[#10a24b]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        <span className="material-symbols-outlined text-lg">{uploading ? 'progress_activity' : 'auto_awesome'}</span>
                        {uploading ? 'Uploading...' : 'Process with AI'}
                    </button>
                </div>
            )}

            {/* Recent Documents — from API */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200"><h3 className="text-lg font-bold text-slate-900">Recent Documents</h3></div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">File Name</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">OCR Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {docs.map(d => (
                            <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-400">description</span>
                                    <span className="text-sm font-medium text-slate-900">{d.filename}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 capitalize">{d.document_type}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">{new Date(d.created_at).toLocaleDateString('en-IN')}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${d.ocr_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : d.ocr_status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{d.ocr_status}</span>
                                </td>
                            </tr>
                        ))}
                        {docs.length === 0 && <tr><td colSpan={4} className="text-center text-slate-400 py-12">{loading ? 'Loading...' : 'No documents uploaded yet.'}</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

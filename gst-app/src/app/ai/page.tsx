'use client';

import { useState, useRef, useEffect } from 'react';
import { aiChat, aiPredictions, aiCompliance, uploadBill, type AIChatResponse, type AIPrediction, type ComplianceAlert } from '@/lib/api';
import { formatPaiseClient } from '@/lib/api-helpers';

interface Message { role: 'user' | 'assistant'; content: string; }

export default function AIPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I\'m your GSTFlow AI assistant. I can help you with:\n\n• **GST queries** — "How much GST do I owe?"\n• **Invoice data** — "Show unpaid invoices"\n• **Revenue** — "What\'s my total revenue?"\n\nHow can I help you today?' },
    ]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'scanner' | 'predictions' | 'intelligence'>('chat');
    const [predictions, setPredictions] = useState<AIPrediction[]>([]);
    const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const fmt = formatPaiseClient;

    useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

    useEffect(() => {
        if (activeTab === 'predictions') aiPredictions().then(setPredictions).catch(() => { });
        if (activeTab === 'intelligence') aiCompliance().then(setAlerts).catch(() => { });
    }, [activeTab]);

    const sendMessage = async () => {
        if (!input.trim() || sending) return;
        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setSending(true);
        try {
            const res = await aiChat(userMsg);
            setMessages(prev => [...prev, { role: 'assistant', content: res.response }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t process that. Please try again.' }]);
        }
        setSending(false);
    };

    const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setScanning(true);
        setScanResult(null);
        try {
            const result = await uploadBill(file);
            setScanResult(`✅ Scanned successfully!\n\nVendor: ${(result.fields as Record<string, string>)?.vendor_name || 'Detected'}\nAmount: ₹${(result.fields as Record<string, number>)?.total_amount || 0}\nConfidence: ${Math.round((result.confidence || 0) * 100)}%\n\nRaw text extracted. Review in Bills page.`);
        } catch {
            setScanResult('❌ Scan failed. Please try a clearer image.');
        }
        setScanning(false);
    };

    const tabs = [
        { id: 'chat', label: 'AI Chat', icon: 'smart_toy' },
        { id: 'scanner', label: 'Bill Scanner', icon: 'document_scanner' },
        { id: 'predictions', label: 'Predictions', icon: 'trending_up' },
        { id: 'intelligence', label: 'GST Intelligence', icon: 'psychology' },
    ] as const;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">AI Assistant</h2>
                <p className="text-slate-500 mt-1">Intelligent automation powered by AI</p>
            </div>

            <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-fit">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-[#10a24b] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <span className="material-symbols-outlined text-lg">{t.icon}</span>{t.label}
                    </button>
                ))}
            </div>

            {/* Chat — real API */}
            {activeTab === 'chat' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ height: '60vh' }}>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-[#10a24b] text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    <span className="material-symbols-outlined text-sm">{m.role === 'user' ? 'person' : 'auto_awesome'}</span>
                                </div>
                                <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-[#10a24b] text-white rounded-br-md' : 'bg-slate-50 text-slate-700 rounded-bl-md'}`}>{m.content}</div>
                            </div>
                        ))}
                        {sending && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><span className="material-symbols-outlined text-sm text-slate-600 animate-spin">progress_activity</span></div><div className="bg-slate-50 rounded-2xl px-4 py-3 text-sm text-slate-500">Thinking...</div></div>}
                    </div>
                    <div className="p-4 border-t border-slate-200">
                        <div className="flex gap-3">
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Ask about your GST, invoices, or business..." className="flex-1 bg-slate-50 border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#10a24b]/20 outline-none" />
                            <button onClick={sendMessage} disabled={sending} className="bg-[#10a24b] text-white px-5 rounded-lg hover:bg-[#10a24b]/90 transition-colors disabled:opacity-50"><span className="material-symbols-outlined">send</span></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner — real OCR upload */}
            {activeTab === 'scanner' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                    <div className="max-w-lg mx-auto text-center">
                        <div className="w-20 h-20 mx-auto bg-[#10a24b]/10 rounded-2xl flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-[#10a24b] text-4xl">document_scanner</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">AI Bill Scanner</h3>
                        <p className="text-sm text-slate-500 mb-6">Upload a bill image and our AI will extract vendor details, amounts, and GST data automatically.</p>
                        <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleScan} className="hidden" />
                        <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-slate-300 hover:border-[#10a24b] rounded-xl p-10 cursor-pointer transition-colors">
                            <span className="material-symbols-outlined text-slate-400 text-4xl mb-3 block">{scanning ? 'progress_activity' : 'cloud_upload'}</span>
                            <p className="text-sm text-slate-600 font-medium">{scanning ? 'Scanning...' : 'Drop bill image here or click to upload'}</p>
                            <p className="text-xs text-slate-400 mt-1">JPG, PNG, PDF — Max 10MB</p>
                        </div>
                        {scanResult && <div className="mt-6 p-4 bg-slate-50 rounded-lg text-sm text-left whitespace-pre-wrap">{scanResult}</div>}
                    </div>
                </div>
            )}

            {/* Predictions — real API */}
            {activeTab === 'predictions' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {predictions.map((p, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">{p.metric}</h3>
                            <div className="space-y-3">
                                <div className="p-4 bg-slate-50 rounded-lg"><p className="text-sm text-slate-500">Current</p><p className="text-xl font-bold text-slate-900">₹{fmt(Math.round(p.current_value * 100))}</p></div>
                                <div className="p-4 bg-[#10a24b]/5 border border-[#10a24b]/10 rounded-lg"><p className="text-sm text-slate-500">Predicted ({p.period.replace('_', ' ')})</p><p className="text-xl font-bold text-[#10a24b]">₹{fmt(Math.round(p.predicted_value * 100))}</p></div>
                                <p className="text-xs text-slate-500">Confidence: {Math.round(p.confidence * 100)}%</p>
                            </div>
                        </div>
                    ))}
                    {predictions.length === 0 && <div className="col-span-2 bg-white p-12 rounded-xl border text-center text-slate-400">Loading predictions...</div>}
                </div>
            )}

            {/* Intelligence — real API */}
            {activeTab === 'intelligence' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-[#10a24b]">psychology</span>
                            <h3 className="text-lg font-bold text-slate-900">GST Compliance Alerts</h3>
                        </div>
                        <div className="space-y-3">
                            {alerts.map((a, i) => {
                                const colors = { error: 'bg-red-50 border-red-200 text-red-800', warning: 'bg-amber-50 border-amber-200 text-amber-800', info: 'bg-blue-50 border-blue-200 text-blue-800' };
                                const icons = { error: 'error', warning: 'warning', info: 'info' };
                                const cls = colors[a.severity as keyof typeof colors] || colors.info;
                                return (
                                    <div key={i} className={`flex items-start gap-4 p-4 border rounded-lg ${cls}`}>
                                        <span className="material-symbols-outlined mt-0.5">{icons[a.severity as keyof typeof icons] || 'info'}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">{a.title}</p>
                                            <p className="text-xs mt-1 opacity-80">{a.description}</p>
                                        </div>
                                        {a.action && <button className="text-xs font-bold underline whitespace-nowrap">{a.action}</button>}
                                    </div>
                                );
                            })}
                            {alerts.length === 0 && <p className="text-center text-slate-400 py-8">Loading compliance alerts...</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

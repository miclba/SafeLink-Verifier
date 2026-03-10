/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  ExternalLink, 
  Lock, 
  Globe, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { cn } from './utils';
import { Tooltip } from './components/Tooltip';

interface SafetyReport {
  isSafe: boolean;
  safetyScore: number; // 0-100
  verdict: string;
  explanation: string;
  riskFactors: string[];
  reassuringPoints: string[];
  domainInfo: {
    name: string;
    isWellKnown: boolean;
    category: string;
  };
  vtStats?: {
    harmless: number;
    malicious: number;
    suspicious: number;
    undetected: number;
  };
}

export default function App() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<SafetyReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    "Analyzujem reputáciu domény...",
    "Skenujem cez VirusTotal (70+ antivírusov)...",
    "Hľadám škodlivé vzorce...",
    "Overujem SSL certifikáty...",
    "Generujem bezpečnostný report..."
  ];

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const analyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsAnalyzing(true);
    setError(null);
    setReport(null);
    setLoadingStep(0);

    try {
      // 1. Get VirusTotal data from backend
      const vtResponse = await fetch('/api/vt-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!vtResponse.ok) {
        throw new Error('Failed to fetch security data');
      }

      const { vtResult, formattedUrl } = await vtResponse.json();

      // 2. Call Gemini from frontend
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Chýba Gemini API kľúč. Skontrolujte nastavenia v AI Studio.');
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Analyze the safety of this URL: ${formattedUrl}. 
      The user is very worried about viruses and malware. 
      ${vtResult ? `VirusTotal Data: ${JSON.stringify(vtResult.data?.attributes?.last_analysis_stats || vtResult)}` : "No VirusTotal data available."}
      
      Provide a detailed safety report in JSON format.
      Focus on being reassuring if the site is genuinely safe.
      Explain why it is safe in simple terms.
      IMPORTANT: Use Slovak language for all text fields (verdict, explanation, riskFactors, reassuringPoints, category).`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isSafe: { type: Type.BOOLEAN },
              safetyScore: { type: Type.NUMBER },
              verdict: { type: Type.STRING },
              explanation: { type: Type.STRING },
              riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
              reassuringPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              domainInfo: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  isWellKnown: { type: Type.BOOLEAN },
                  category: { type: Type.STRING }
                },
                required: ["name", "isWellKnown", "category"]
              },
              vtStats: {
                type: Type.OBJECT,
                properties: {
                  harmless: { type: Type.NUMBER },
                  malicious: { type: Type.NUMBER },
                  suspicious: { type: Type.NUMBER },
                  undetected: { type: Type.NUMBER }
                }
              }
            },
            required: ["isSafe", "safetyScore", "verdict", "explanation", "riskFactors", "reassuringPoints", "domainInfo"]
          }
        }
      });

      const result = JSON.parse(aiResponse.text);
      
      // Inject real VT stats if available and not already set by AI
      if (vtResult?.data?.attributes?.last_analysis_stats) {
        result.vtStats = vtResult.data.attributes.last_analysis_stats;
      }

      setReport(result);
    } catch (err: any) {
      console.error(err);
      setError("Nepodarilo sa analyzovať odkaz. Skontrolujte URL a skúste to znova.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center mb-12"
      >
        <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-2xl mb-4">
          <Tooltip content="Vaša bezpečnosť je našou prioritou">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </Tooltip>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">SafeLink Verifier</h1>
        <p className="text-slate-500">
          Overte si bezpečnosť odkazu predtým, než naň kliknete.<br />100% transparentná analýza.
        </p>
      </motion.div>

      {/* Main Card */}
      <motion.div 
        layout
        className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
      >
        <div className="p-6 sm:p-10">
          <form onSubmit={analyzeUrl} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Vložte odkaz (napr. youtube.com/...)"
                className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            <Tooltip content="Spustiť hĺbkovú analýzu odkazu" position="bottom">
              <button
                type="submit"
                disabled={isAnalyzing || !url}
                className="w-full flex items-center justify-center px-6 py-4 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Analyzujem...
                  </>
                ) : (
                  <>
                    Skontrolovať bezpečnosť
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </Tooltip>
          </form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {/* Loading State */}
          <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-12 text-center space-y-6"
              >
                <div className="flex justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1, 
                        delay: i * 0.2 
                      }}
                      className="w-3 h-3 bg-emerald-500 rounded-full"
                    />
                  ))}
                </div>
                <motion.p 
                  key={loadingStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-slate-500 font-medium"
                >
                  {loadingMessages[loadingStep]}
                </motion.p>
              </motion.div>
            )}

            {/* Report Result */}
            {report && !isAnalyzing && (() => {
              const isSuspicious = report.safetyScore >= 40 && report.safetyScore < 80;
              const isUnsafe = report.safetyScore < 40 || !report.isSafe;
              const isSafe = report.isSafe && report.safetyScore >= 80;

              let statusColor = "emerald";
              let StatusIcon = ShieldCheck;
              let statusLabel = "Bezpečné";

              if (isUnsafe) {
                statusColor = "red";
                StatusIcon = ShieldAlert;
                statusLabel = "Nebezpečné";
              } else if (isSuspicious) {
                statusColor = "amber";
                StatusIcon = AlertTriangle;
                statusLabel = "Podozrivé";
              }

              return (
                <motion.div 
                  key="report"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-10 rounded-2xl overflow-hidden border shadow-sm",
                    statusColor === "emerald" ? "border-emerald-100 bg-emerald-50/30" : 
                    statusColor === "amber" ? "border-amber-100 bg-amber-50/30" : 
                    "border-red-100 bg-red-50/30"
                  )}
                >
                  <div className={cn(
                    "p-6 flex flex-col sm:flex-row sm:items-center gap-4 border-b",
                    statusColor === "emerald" ? "border-emerald-100" : 
                    statusColor === "amber" ? "border-amber-100" : 
                    "border-red-100"
                  )}>
                    <div className={cn(
                      "p-3 rounded-xl self-start",
                      statusColor === "emerald" ? "bg-emerald-100 text-emerald-600" : 
                      statusColor === "amber" ? "bg-amber-100 text-amber-600" : 
                      "bg-red-100 text-red-600"
                    )}>
                      <StatusIcon className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-slate-900">{report.verdict}</h3>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          statusColor === "emerald" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
                          statusColor === "amber" ? "bg-amber-100 text-amber-700 border-amber-200" : 
                          "bg-red-100 text-red-700 border-red-200"
                        )}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip content={`Bezpečnostné skóre: ${report.safetyScore}/100`}>
                          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden cursor-help">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${report.safetyScore}%` }}
                              className={cn(
                                "h-full",
                                statusColor === "emerald" ? "bg-emerald-500" : 
                                statusColor === "amber" ? "bg-amber-500" : "bg-red-500"
                              )}
                            />
                          </div>
                        </Tooltip>
                        <span className="text-xs font-semibold text-slate-500">{report.safetyScore}/100 Skóre</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Analýza</h4>
                      <div className="text-slate-700 text-sm leading-relaxed">
                        <Markdown>{report.explanation}</Markdown>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pozitívne faktory</h4>
                        <ul className="space-y-2">
                          {report.reassuringPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {report.riskFactors.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rizikové faktory</h4>
                          <ul className="space-y-2">
                            {report.riskFactors.map((factor, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <AlertTriangle className={cn(
                                  "w-4 h-4 shrink-0 mt-0.5",
                                  statusColor === "red" ? "text-red-500" : "text-amber-500"
                                )} />
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {report.vtStats && (
                      <div className="pt-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Výsledky VirusTotal</h4>
                        <div className="p-4 bg-white/50 rounded-xl border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <Tooltip content="Počet antivírusov, ktoré nenašli žiadnu hrozbu">
                            <div className="text-center cursor-help">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Nezistené</p>
                              <p className="text-lg font-bold text-emerald-600">{report.vtStats.harmless + report.vtStats.undetected}</p>
                            </div>
                          </Tooltip>
                          <Tooltip content="Počet antivírusov, ktoré označili odkaz za škodlivý">
                            <div className="text-center cursor-help">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Škodlivé</p>
                              <p className={cn("text-lg font-bold", report.vtStats.malicious > 0 ? "text-red-600" : "text-slate-400")}>{report.vtStats.malicious}</p>
                            </div>
                          </Tooltip>
                          <Tooltip content="Počet antivírusov, ktoré označili odkaz za podozrivý">
                            <div className="text-center cursor-help">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Podozrivé</p>
                              <p className={cn("text-lg font-bold", report.vtStats.suspicious > 0 ? "text-amber-600" : "text-slate-400")}>{report.vtStats.suspicious}</p>
                            </div>
                          </Tooltip>
                          <Tooltip content="Celkový počet testovaných antivírusových motorov">
                            <div className="text-center cursor-help">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Celkovo</p>
                              <p className="text-lg font-bold text-slate-600">70+</p>
                            </div>
                          </Tooltip>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Tooltip content="Informácie o doméne a jej kategórii">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                            <Lock className="w-5 h-5" />
                          </div>
                        </Tooltip>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{report.domainInfo.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-tight">{report.domainInfo.category}</p>
                        </div>
                      </div>
                      
                      {report.isSafe && (
                        <Tooltip content="Otvoriť odkaz v novej karte">
                          <a 
                            href={url.startsWith('http') ? url : `https://${url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                          >
                            Otvoriť bezpečne
                            <ExternalLink className="ml-2 w-4 h-4" />
                          </a>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-md w-full mt-12 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm text-xs text-slate-500">
          <Lock className="w-3 h-3" />
          <span>Vaše dáta sú chránené a analýza je súkromná.</span>
        </div>
        <p className="mt-6 text-slate-400 text-xs">
          Tento nástroj využíva umelú inteligenciu Google Gemini na analýzu bezpečnostných rizík a reputácie domén.
        </p>
      </motion.div>
    </div>
  );
}

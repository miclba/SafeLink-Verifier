/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  ShieldCheck, 
  Globe, 
  AlertTriangle,
  Loader2,
  ArrowRight,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';
import { Tooltip } from './components/Tooltip';
import { SecurityReport } from './components/SecurityReport';
import { SafetyReportData } from './types';

export default function App() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<SafetyReportData | null>(null);
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
            {report && !isAnalyzing && (
              <SecurityReport report={report} url={url} />
            )}
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

import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  ExternalLink,
  Info,
  Activity,
  Globe,
  Fingerprint,
  Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';
import Markdown from 'react-markdown';
import { cn } from '../utils';
import { Tooltip } from './Tooltip';
import { SafetyReportData } from '../types';

interface SecurityReportProps {
  report: SafetyReportData;
  url: string;
}

export const SecurityReport: React.FC<SecurityReportProps> = ({ report, url }) => {
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "mt-10 rounded-3xl overflow-hidden border shadow-2xl",
        statusColor === "emerald" ? "border-emerald-100 bg-white" : 
        statusColor === "amber" ? "border-amber-100 bg-white" : 
        "border-red-100 bg-white"
      )}
    >
      {/* Header with Status Banner */}
      <div className={cn(
        "p-8 flex flex-col sm:flex-row sm:items-center gap-6 border-b",
        statusColor === "emerald" ? "bg-emerald-50/50 border-emerald-100" : 
        statusColor === "amber" ? "bg-amber-50/50 border-amber-100" : 
        "bg-red-50/50 border-red-100"
      )}>
        <motion.div 
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className={cn(
            "p-5 rounded-2xl self-start shadow-lg",
            statusColor === "emerald" ? "bg-emerald-500 text-white shadow-emerald-200" : 
            statusColor === "amber" ? "bg-amber-500 text-white shadow-amber-200" : 
            "bg-red-500 text-white shadow-red-200"
          )}
        >
          <StatusIcon className="w-10 h-10" />
        </motion.div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-2xl font-bold text-slate-900">{report.verdict}</h3>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border",
              statusColor === "emerald" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
              statusColor === "amber" ? "bg-amber-100 text-amber-700 border-amber-200" : 
              "bg-red-100 text-red-700 border-red-200"
            )}>
              {statusLabel}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-[240px]">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bezpečnostné skóre</span>
                <span className={cn(
                  "text-sm font-bold",
                  statusColor === "emerald" ? "text-emerald-600" : 
                  statusColor === "amber" ? "text-amber-600" : "text-red-600"
                )}>{report.safetyScore}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${report.safetyScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    statusColor === "emerald" ? "bg-emerald-500" : 
                    statusColor === "amber" ? "bg-amber-500" : "bg-red-500"
                  )}
                />
              </div>
            </div>
            <div className="hidden sm:block h-10 w-px bg-slate-200/60 mx-2" />
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Globe className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">Doména</p>
                <p className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{report.domainInfo.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-10">
        {/* Analysis Section */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Hĺbková analýza</h4>
          </div>
          <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
            <Markdown>{report.explanation}</Markdown>
          </div>
        </motion.section>

        {/* Factors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.section variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Bezpečnostné ukazovatele</h4>
            </div>
            <div className="space-y-3">
              {report.reassuringPoints.map((point, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/50"
                >
                  <div className="mt-1 p-0.5 bg-emerald-100 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">{point}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>
          
          {report.riskFactors.length > 0 && (
            <motion.section variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn(
                  "w-4 h-4",
                  statusColor === "red" ? "text-red-500" : "text-amber-500"
                )} />
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Identifikované riziká</h4>
              </div>
              <div className="space-y-3">
                {report.riskFactors.map((factor, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border",
                      statusColor === "red" ? "bg-red-50/30 border-red-100/50" : "bg-amber-50/30 border-amber-100/50"
                    )}
                  >
                    <div className={cn(
                      "mt-1 p-0.5 rounded-full",
                      statusColor === "red" ? "bg-red-100" : "bg-amber-100"
                    )}>
                      <AlertTriangle className={cn(
                        "w-3 h-3",
                        statusColor === "red" ? "text-red-600" : "text-amber-600"
                      )} />
                    </div>
                    <span className="text-sm text-slate-700 font-medium">{factor}</span>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </div>

        {/* VirusTotal Technical Data - Recipe 1 Inspired */}
        {report.vtStats && (
          <motion.section variants={itemVariants} className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Technické dáta (VirusTotal)</h4>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Live Scan Active</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
              <div className="bg-white p-5 flex flex-col items-center justify-center group hover:bg-slate-50 transition-colors">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2 italic">Clean</p>
                <p className="text-3xl font-mono font-bold text-emerald-600 tracking-tighter">
                  {report.vtStats.harmless + report.vtStats.undetected}
                </p>
                <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Engines</p>
              </div>
              
              <div className="bg-white p-5 flex flex-col items-center justify-center group hover:bg-slate-50 transition-colors">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2 italic">Malicious</p>
                <p className={cn(
                  "text-3xl font-mono font-bold tracking-tighter",
                  report.vtStats.malicious > 0 ? "text-red-600" : "text-slate-300"
                )}>
                  {report.vtStats.malicious}
                </p>
                <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Detections</p>
              </div>
              
              <div className="bg-white p-5 flex flex-col items-center justify-center group hover:bg-slate-50 transition-colors">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2 italic">Suspicious</p>
                <p className={cn(
                  "text-3xl font-mono font-bold tracking-tighter",
                  report.vtStats.suspicious > 0 ? "text-amber-600" : "text-slate-300"
                )}>
                  {report.vtStats.suspicious}
                </p>
                <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Alerts</p>
              </div>
              
              <div className="bg-white p-5 flex flex-col items-center justify-center group hover:bg-slate-50 transition-colors">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2 italic">Total</p>
                <p className="text-3xl font-mono font-bold text-slate-800 tracking-tighter">70+</p>
                <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Analyzed</p>
              </div>
            </div>
            
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[10px] text-slate-500 font-medium">
                VirusTotal agreguje výsledky z viac ako 70 antivírusových skenerov a blacklistov.
              </p>
            </div>
          </motion.section>
        )}

        {/* Footer Actions */}
        <motion.div 
          variants={itemVariants}
          className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner border border-white">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{report.domainInfo.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{report.domainInfo.category}</span>
                {report.domainInfo.isWellKnown && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Overená doména
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {report.isSafe && (
              <a 
                href={url.startsWith('http') ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 group"
              >
                Otvoriť bezpečne
                <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            )}
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors"
            >
              <Activity className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Bottom Security Badge */}
      <div className="bg-slate-900 py-3 px-8 flex items-center justify-center gap-2">
        <Lock className="w-3 h-3 text-emerald-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Verified by SafeLink AI Core</span>
      </div>
    </motion.div>
  );
};

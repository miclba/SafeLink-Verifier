export interface SafetyReportData {
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

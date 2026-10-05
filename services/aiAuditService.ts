/**
 * File: services/aiAuditService.ts
 * Purpose: Lightweight client/server telemetry, audit logging, and health monitoring for Hirush AI Copilot.
 * Records query latency, cache efficiency, model usage, and error metrics for administrative observability.
 * Author: Hirush Global AMS
 */

export interface AIAuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: string;
  intent: string;
  query: string;
  isDeterministic: boolean;
  modelUsed?: string;
  cacheHit: boolean;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface AIHealthMetrics {
  totalRequestsToday: number;
  deterministicPercentage: number;
  geminiPercentage: number;
  cacheHitPercentage: number;
  averageLatencyMs: number;
  errorCount: number;
  estimatedCostUSD: number;
}

// In-memory ring buffer (up to 100 recent entries)
const recentLogs: AIAuditEntry[] = [];
const MAX_LOGS = 100;

export function recordAiAudit(entry: Omit<AIAuditEntry, 'id' | 'timestamp'>): void {
  const fullEntry: AIAuditEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
  };

  recentLogs.unshift(fullEntry);
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.pop();
  }

  // Also persist recent 20 logs in localStorage on client side for session stats
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('hirush_ai_recent_audits');
      const list: AIAuditEntry[] = stored ? JSON.parse(stored) : [];
      list.unshift(fullEntry);
      localStorage.setItem('hirush_ai_recent_audits', JSON.stringify(list.slice(0, 30)));
    } catch {
      // Ignore localStorage quotas
    }
  }
}

export function getAiHealthMetrics(): AIHealthMetrics {
  const total = recentLogs.length;
  if (total === 0) {
    return {
      totalRequestsToday: 0,
      deterministicPercentage: 100,
      geminiPercentage: 0,
      cacheHitPercentage: 0,
      averageLatencyMs: 0,
      errorCount: 0,
      estimatedCostUSD: 0,
    };
  }

  const deterministicCount = recentLogs.filter(l => l.isDeterministic).length;
  const geminiCount = total - deterministicCount;
  const cacheHitCount = recentLogs.filter(l => l.cacheHit).length;
  const errorCount = recentLogs.filter(l => !l.success).length;
  const totalLatency = recentLogs.reduce((acc, l) => acc + (l.latencyMs || 0), 0);

  // Gemini 3.8 Flash is ~$0.0001 per query on average
  const estimatedCost = (geminiCount * 0.0001);

  return {
    totalRequestsToday: total,
    deterministicPercentage: Math.round((deterministicCount / total) * 100),
    geminiPercentage: Math.round((geminiCount / total) * 100),
    cacheHitPercentage: Math.round((cacheHitCount / total) * 100),
    averageLatencyMs: Math.round(totalLatency / total),
    errorCount,
    estimatedCostUSD: Number(estimatedCost.toFixed(4)),
  };
}

export function getRecentAiLogs(): AIAuditEntry[] {
  return [...recentLogs];
}

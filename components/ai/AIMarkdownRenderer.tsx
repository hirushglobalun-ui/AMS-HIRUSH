/**
 * File: components/ai/AIMarkdownRenderer.tsx
 * Purpose: Enterprise markdown parser and rich visual renderer for Hirush AI Copilot responses.
 * Renders real HTML tables, status badges, metric chips, and formatted typography.
 */

'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Home,
  Fingerprint,
  MapPin,
  TrendingUp,
  Briefcase,
  Users,
} from 'lucide-react';

interface AIMarkdownRendererProps {
  content: string;
}

export const AIMarkdownRenderer: React.FC<AIMarkdownRendererProps> = ({ content }) => {
  const renderPill = (val: string) => {
    const clean = val.replace(/['"`]/g, '').trim();
    const lower = clean.toLowerCase();

    if (lower === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
          <Clock size={11} className="text-amber-500" />
          Pending
        </span>
      );
    }
    if (lower === 'approved' || lower === 'healthy' || lower === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
          <CheckCircle2 size={11} className="text-emerald-500" />
          {clean}
        </span>
      );
    }
    if (lower === 'ongoing' || lower === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
          <TrendingUp size={11} className="text-blue-500" />
          {clean}
        </span>
      );
    }
    if (lower === 'rejected' || lower === 'issue detected' || lower === 'action required') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
          <AlertTriangle size={11} className="text-rose-500" />
          {clean}
        </span>
      );
    }
    if (lower.includes('wfh')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Home size={11} className="text-purple-500" />
          WFH
        </span>
      );
    }
    if (lower.includes('biometric')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Fingerprint size={11} className="text-indigo-500" />
          Biometric
        </span>
      );
    }
    if (lower.includes('location')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <MapPin size={11} className="text-slate-500" />
          Location
        </span>
      );
    }

    // Default clean text
    return <span>{clean}</span>;
  };

  const parseInlineStyles = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-600">$1</em>')
      .replace(
        /`(.*?)`/g,
        '<code class="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold">$1</code>'
      );
  };

  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let tableRowsBuffer: string[] = [];

  const flushTable = (keyPrefix: number) => {
    if (tableRowsBuffer.length < 2) {
      tableRowsBuffer = [];
      return;
    }

    const headerLine = tableRowsBuffer[0];
    const dataLines = tableRowsBuffer.slice(1).filter(l => !l.includes('---'));

    const headers = headerLine
      .slice(1, -1)
      .split('|')
      .map(c => c.trim().replace(/\*\*/g, ''));

    blocks.push(
      <div
        key={`table-${keyPrefix}`}
        className="my-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
      >
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80">
                {headers.map((h, hIdx) => (
                  <th
                    key={hIdx}
                    className="py-2.5 px-3 font-bold text-[11px] uppercase tracking-wider text-slate-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataLines.map((rowStr, rIdx) => {
                const cols = rowStr
                  .slice(1, -1)
                  .split('|')
                  .map(c => c.trim());
                return (
                  <tr
                    key={rIdx}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {cols.map((col, cIdx) => (
                      <td
                        key={cIdx}
                        className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap"
                      >
                        {renderPill(col)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );

    tableRowsBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line is a table row
    if (line.startsWith('|') && line.endsWith('|')) {
      tableRowsBuffer.push(line);
      continue;
    } else if (tableRowsBuffer.length > 0) {
      flushTable(i);
    }

    // Heading 3
    if (line.startsWith('### ')) {
      blocks.push(
        <h3
          key={`h3-${i}`}
          className="text-sm sm:text-base font-bold text-slate-900 mt-3 mb-1.5 flex items-center gap-2"
        >
          {line.replace('### ', '')}
        </h3>
      );
      continue;
    }

    // Heading 4
    if (line.startsWith('#### ')) {
      blocks.push(
        <h4
          key={`h4-${i}`}
          className="text-xs sm:text-sm font-semibold text-slate-800 mt-2.5 mb-1"
        >
          {line.replace('#### ', '')}
        </h4>
      );
      continue;
    }

    // Check if bullet point is a KPI metric like "• Pending Approvals: 4"
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      const cleanLine = line.replace(/^[•\-\*]\s*/, '');
      const metricMatch = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);

      if (metricMatch) {
        const title = metricMatch[1];
        const val = metricMatch[2].replace(/`/g, '');
        blocks.push(
          <div
            key={`metric-${i}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/70 border border-slate-200/80 mr-2 my-1 text-xs"
          >
            <span className="text-slate-500 font-medium">{title}:</span>
            <span className="font-bold text-indigo-700 font-mono">{val}</span>
          </div>
        );
        continue;
      }

      blocks.push(
        <li
          key={`li-${i}`}
          className="text-xs text-slate-700 ml-4 list-disc my-0.5 leading-relaxed"
        >
          <span dangerouslySetInnerHTML={{ __html: parseInlineStyles(cleanLine) }} />
        </li>
      );
      continue;
    }

    // Regular text
    if (line) {
      blocks.push(
        <p
          key={`p-${i}`}
          className="text-xs sm:text-sm text-slate-700 leading-relaxed my-1"
          dangerouslySetInnerHTML={{ __html: parseInlineStyles(line) }}
        />
      );
    }
  }

  if (tableRowsBuffer.length > 0) {
    flushTable(lines.length);
  }

  return <div className="space-y-1">{blocks}</div>;
};

export default AIMarkdownRenderer;

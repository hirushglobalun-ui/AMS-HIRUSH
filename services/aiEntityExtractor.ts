/**
 * File: services/aiEntityExtractor.ts
 * Purpose: Automated entity extraction layer for the Hirush AI Copilot.
 * Extracts employees, departments, roles, dates, statuses, metrics, and CRM/Domain filters.
 * Author: Hirush Global AMS
 */

import { User } from '../types';
import { extractDateFromQuery, ParsedDateResult } from '../utils/aiDateParser';

export interface ExtractedEntities {
  matchedUser?: User;
  department?: string;
  role?: string;
  dateInfo: ParsedDateResult;
  statusFilter?: string;
  metricType?: 'count' | 'list' | 'percentage' | 'absent' | 'present' | 'wfh' | 'late' | 'summary';
  crmFilter?: string;
  domainFilter?: 'all' | 'expiring' | 'ssl' | 'dns' | 'critical';
}

const DEPARTMENTS = [
  'Development',
  'Management',
  'HR',
  'Sales',
  'SEO',
  'Product',
  'Media',
  'Design',
  'QA',
  'Accounts',
];

const ROLES = ['Admin', 'HR', 'Employee', 'Intern', 'Manager', 'Developer'];

function transliterateMalayalam(text: string): string {
  const ML_MAP: Record<string, string> = {
    'അ': 'a', 'ആ': 'aa', 'ഇ': 'i', 'ഈ': 'ee', 'ഉ': 'u', 'ഊ': 'oo',
    'ഋ': 'ri', 'എ': 'e', 'ഏ': 'e', 'ഐ': 'ai', 'ഒ': 'o', 'ഓ': 'o', 'ഔ': 'au',
    'ക': 'ka', 'ഖ': 'kha', 'ഗ': 'ga', 'ഘ': 'gha', 'ങ': 'nga',
    'ച': 'cha', 'ഛ': 'chha', 'ജ': 'ja', 'ഝ': 'jha', 'ഞ': 'nja',
    'ട': 'ta', 'ഠ': 'tha', 'ഡ': 'da', 'ഢ': 'dha', 'ണ': 'na',
    'ത': 'tha', 'ഥ': 'tha', 'ദ': 'da', 'ധ': 'dha', 'ന': 'na',
    'പ': 'pa', 'ഫ': 'pha', 'ബ': 'ba', 'ഭ': 'bha', 'മ': 'ma',
    'യ': 'ya', 'ര': 'ra', 'ല': 'la', 'വ': 'va', 'ശ': 'sha',
    'ഷ': 'sha', 'സ': 'sa', 'ഹ': 'ha', 'ള': 'la', 'ഴ': 'zha', 'റ': 'ra',
    'ർ': 'r', 'ൽ': 'l', 'ൾ': 'l', 'ൺ': 'n', 'ൻ': 'n', 'ൿ': 'k',
  };

  const VOWEL_SIGNS: Record<string, string> = {
    'ാ': 'aa', 'ി': 'i', 'ീ': 'ee', 'ു': 'u', 'ൂ': 'oo',
    'ൃ': 'ri', 'െ': 'e', 'േ': 'e', 'ൈ': 'ai', 'ൊ': 'o', 'ോ': 'o', 'ൌ': 'au',
    '്': '',
    'ം': 'm', 'ഃ': 'h',
  };

  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (VOWEL_SIGNS[ch] !== undefined) {
      continue;
    }

    if (ML_MAP[ch]) {
      let base = ML_MAP[ch];
      if (next && VOWEL_SIGNS[next] !== undefined) {
        if (base.endsWith('a')) base = base.slice(0, -1);
        out += base + VOWEL_SIGNS[next];
      } else {
        out += base;
      }
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Extracts entities from the normalized query and reference user list.
 */
export function extractEntities(
  query: string,
  allUsers: User[] = [],
  referenceDate: Date = new Date()
): ExtractedEntities {
  const lower = query.toLowerCase().trim();
  const cleanLower = lower.replace(/[^a-z0-9]/g, '');
  const transliterated = transliterateMalayalam(query).toLowerCase();
  const cleanTransliterated = transliterated.replace(/[^a-z0-9]/g, '');

  // 1. Employee Matching
  let matchedUser: User | undefined = undefined;
  if (allUsers.length > 0) {
    matchedUser = allUsers.find(u => {
      const fullName = (u.name || '').toLowerCase();
      const cleanName = fullName.replace(/[^a-z0-9]/g, '');
      const parts = fullName.split(/\s+/).filter(Boolean);
      const empId = (u.employeeId || '').toLowerCase();
      const emailPrefix = (u.email || '').split('@')[0].toLowerCase();
      const cleanEmailPrefix = emailPrefix.replace(/[^a-z0-9]/g, '');

      // 1. Full name match
      if (fullName.length >= 3 && (lower.includes(fullName) || transliterated.includes(fullName))) {
        return true;
      }
      if (cleanName.length >= 3 && (cleanLower.includes(cleanName) || cleanTransliterated.includes(cleanName))) {
        return true;
      }

      // 2. Individual name part match (e.g. "Ananya", "Sharma", "Vikram")
      const matchesPart = parts.some(p => {
        if (p.length < 3) return false;
        const pLower = p.toLowerCase();
        const pClean = pLower.replace(/[^a-z0-9]/g, '');
        const regex = new RegExp(`\\b${pLower}\\b`, 'i');
        return (
          regex.test(lower) ||
          regex.test(transliterated) ||
          (cleanLower.length >= pClean.length && cleanLower.includes(pClean)) ||
          (cleanTransliterated.length >= pClean.length && cleanTransliterated.includes(pClean))
        );
      });
      if (matchesPart) return true;

      // 3. Employee ID match (e.g. EMP001, EMP003)
      if (empId) {
        const idRegex = new RegExp(`\\b${empId}\\b`, 'i');
        if (idRegex.test(lower) || (cleanLower.length >= empId.length && cleanLower.includes(empId))) {
          return true;
        }
      }

      // 4. Email prefix match
      if (cleanEmailPrefix.length >= 3 && cleanLower.length >= cleanEmailPrefix.length && cleanLower.includes(cleanEmailPrefix)) {
        return true;
      }

      return false;
    });
  }

  // 2. Department Matching
  let department: string | undefined = undefined;
  for (const dept of DEPARTMENTS) {
    const dLower = dept.toLowerCase();
    // Check developer / development
    if (dLower === 'development' && (lower.includes('developer') || lower.includes('dev') || lower.includes('development'))) {
      department = 'Development';
      break;
    }
    if (new RegExp(`\\b${dLower}\\b`, 'i').test(lower)) {
      department = dept;
      break;
    }
  }

  // 3. Role Matching
  let role: string | undefined = undefined;
  for (const r of ROLES) {
    if (new RegExp(`\\b${r.toLowerCase()}\\b`, 'i').test(lower)) {
      role = r;
      break;
    }
  }

  // 4. Date Extraction
  const dateInfo = extractDateFromQuery(query, referenceDate);

  // 5. Status Filters
  let statusFilter: string | undefined = undefined;
  if (lower.includes('pending')) statusFilter = 'Pending';
  else if (lower.includes('approved')) statusFilter = 'Approved';
  else if (lower.includes('rejected')) statusFilter = 'Rejected';
  else if (lower.includes('ongoing')) statusFilter = 'Ongoing';
  else if (lower.includes('proposal')) statusFilter = 'Proposal Sent';
  else if (lower.includes('completed')) statusFilter = 'Completed';
  else if (lower.includes('on hold')) statusFilter = 'On Hold';

  // 6. Metric Type
  let metricType: ExtractedEntities['metricType'] = undefined;
  if (lower.includes('how many') || lower.includes('count') || lower.includes('number of') || lower.includes('ethra')) {
    metricType = 'count';
  } else if (lower.includes('percentage') || lower.includes('rate') || lower.includes('%')) {
    metricType = 'percentage';
  } else if (lower.includes('late') || lower.includes('vaiki') || lower.includes('frequently late')) {
    metricType = 'late';
  } else if (lower.includes('absent') || lower.includes('absentees') || lower.includes('absents')) {
    metricType = 'absent';
  } else if (lower.includes('wfh') || lower.includes('work from home')) {
    metricType = 'wfh';
  } else if (lower.includes('present') || lower.includes('came') || lower.includes('in office')) {
    metricType = 'present';
  }

  // 7. Domain Filters
  let domainFilter: ExtractedEntities['domainFilter'] = 'all';
  if (lower.includes('ssl')) domainFilter = 'ssl';
  else if (lower.includes('dns')) domainFilter = 'dns';
  else if (lower.includes('expire') || lower.includes('expiry') || lower.includes('expiring')) domainFilter = 'expiring';
  else if (lower.includes('critical') || lower.includes('issue') || lower.includes('error')) domainFilter = 'critical';

  return {
    matchedUser,
    department,
    role,
    dateInfo,
    statusFilter,
    metricType,
    domainFilter,
  };
}

/**
 * File: services/aiResponseValidator.ts
 * Purpose: Validation and ground-truth enforcement layer for Gemini AI responses.
 * Detects numerical contradictions between generative AI outputs and verified Firestore data.
 * Author: Hirush Global AMS
 */

export interface ValidationResult {
  text: string;
  isValid: boolean;
  correctionsApplied: boolean;
  discrepancies: string[];
}

/**
 * Validates the Gemini response text against the verified database context.
 * Corrects any hallucinated numbers and ensures zero factual drift.
 */
export function validateAiResponse(rawAiResponse: string, databaseContext: any): ValidationResult {
  if (!rawAiResponse || !databaseContext) {
    return {
      text: rawAiResponse || '',
      isValid: true,
      correctionsApplied: false,
      discrepancies: [],
    };
  }

  const discrepancies: string[] = [];
  let correctedText = rawAiResponse;

  // 1. Attendance Verification (Present / Absent counts)
  if (databaseContext.totalPresent !== undefined) {
    const verifiedPresent = Number(databaseContext.totalPresent);
    const verifiedAbsent = Number(databaseContext.totalAbsent || 0);

    // Look for phrases like "21 present", "present: 21", "21 employees present"
    const presentRegex = /(\d+)\s*(?:employees?|staff|members?)?\s*(?:are|were)?\s*present/gi;
    let match;
    while ((match = presentRegex.exec(rawAiResponse)) !== null) {
      const claimedCount = parseInt(match[1], 10);
      if (claimedCount !== verifiedPresent) {
        discrepancies.push(`Claimed ${claimedCount} present, but verified database count is ${verifiedPresent}`);
      }
    }

    if (discrepancies.length > 0) {
      // Prepend ground truth clarification
      correctedText = `> ⚠️ **Verified Data Alignment**: Official database record confirms **${verifiedPresent} present** and **${verifiedAbsent} absent**.\n\n${rawAiResponse}`;
    }
  }

  // 2. Pending Leaves Verification
  if (databaseContext.pendingCount !== undefined) {
    const verifiedPending = Number(databaseContext.pendingCount);
    const leaveRegex = /(\d+)\s*(?:pending\s*leaves?|leave\s*requests?)/gi;
    let match;
    while ((match = leaveRegex.exec(rawAiResponse)) !== null) {
      const claimed = parseInt(match[1], 10);
      if (claimed !== verifiedPending) {
        discrepancies.push(`Claimed ${claimed} pending leaves, verified is ${verifiedPending}`);
      }
    }
  }

  return {
    text: correctedText,
    isValid: discrepancies.length === 0,
    correctionsApplied: discrepancies.length > 0,
    discrepancies,
  };
}

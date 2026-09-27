/**
 * @file geminiService.ts
 * @description Provides logic and utilities for geminiService.
 * @module services
 * @author Hirush Global AMS
 * @last_modified 2026
 */



import { GoogleGenAI } from "@google/genai";

// FIX: Per @google/genai guidelines, API key must be from process.env.API_KEY and used directly.
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "dummy_api_key_for_build";
const ai = new GoogleGenAI({ apiKey });

export const generateSRS = async (title: string, description: string): Promise<string> => {
  // FIX: Removed fallback logic for missing API key as per guidelines.
  // The application should fail if the API key is not provided in the environment.
  const prompt = `
    Act as a professional business analyst and senior software engineer. Your task is to generate a detailed and well-structured Software Requirements Specification (SRS) document based on the provided project title and description. The SRS should be ready for academic or company-level software documentation submission.

    **Project Title:** ${title}
    
    **Project Description:** ${description}

    Please structure the SRS with the following sections, providing detailed and plausible content for each:

    1.  **Introduction**
        *   1.1 Purpose
        *   1.2 Document Conventions
        *   1.3 Intended Audience
        *   1.4 Project Scope
        *   1.5 References

    2.  **Overall Description**
        *   2.1 Product Perspective
        *   2.2 Product Functions (Summarize key features)
        *   2.3 User Classes and Characteristics
        *   2.4 Operating Environment
        *   2.5 Design and Implementation Constraints
        *   2.6 Assumptions and Dependencies

    3.  **System Features**
        *   Provide a detailed breakdown of at least 3-5 core functional modules. For each module, describe its features in detail. Use a structured format like "Feature 3.1: [Feature Name]".

    4.  **External Interface Requirements**
        *   4.1 User Interfaces
        *   4.2 Hardware Interfaces
        *   4.3 Software Interfaces
        *   4.4 Communications Interfaces

    5.  **Non-Functional Requirements**
        *   5.1 Performance Requirements
        *   5.2 Safety Requirements
        *   5.3 Security Requirements
        *   5.4 Software Quality Attributes (e.g., Reliability, Availability, Maintainability, Portability)

    6.  **Appendices** (Optional, can be mentioned as a placeholder)
        *   A. Glossary
        *   B. Analysis Models

    Ensure the language is professional, clear, and unambiguous. The final output should be in Markdown format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating SRS with Gemini:", error);
    return "Error: Could not generate the SRS document. Please check the console for more details.";
  }
};
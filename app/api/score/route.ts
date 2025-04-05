// app/api/score/route.ts

import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize Gemini client using the API key from environment variables
const genAI = new GoogleGenAI({apiKey: process.env.GOOGLE_API_KEY || ""});

// Define the expected structure for the AI's response
interface AIScoreResponse {
  laborScore: number;
  climateScore: number;
  humanRightsScore: number;
  laborExplanation: string;
  climateExplanation: string;
  humanRightsExplanation: string;
  alternatives: Array<{
    name: string;
    reason: string;
  }>;
}

export async function POST(request: Request) {
  // 1. Check if the API key is available
  if (!process.env.GOOGLE_API_KEY) {
    console.error("Google API key not found.");
    return NextResponse.json(
      { error: "Server configuration error: Missing API key." },
      { status: 500 },
    );
  }

  // 2. Parse the request body to get the product name
  let productName: string;
  try {
    const body = await request.json();
    productName = body.productName;

    if (!productName || typeof productName !== "string" || productName.trim() === "") {
      return NextResponse.json(
        { error: "Product name is required and must be a non-empty string." },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON with 'productName'." },
      { status: 400 },
    );
  }

  const systemPrompt = `
You are an ethical product evaluator. Your task is to assess the ethical standing of a given product or company based on three specific categories:

1. **Labor Ethics (0-10)**: Evaluate employee treatment, including wages, workplace safety, working conditions, and labor rights. Consider issues like child labor, forced labor, or poor working conditions.

2. **Climate Ethics (0-10)**: Assess the company's environmental impact, including carbon footprint, sustainable sourcing, packaging, and whether the company invests in fossil fuels or contributes to climate change.

3. **Human Rights Ethics (0-10)**: Evaluate whether the company invests in or contributes to human rights violations, such as supporting oppressive regimes, contributing to conflicts, or engaging in practices that harm communities.

For each category, provide a score from 0 (very unethical) to 10 (very ethical).

CRITICAL: 
- Explanations MUST be exactly ONE short sentence that captures the most important factor affecting the score. Be extremely concise.
- ALWAYS suggest exactly 3 other ethical options in this market/category, regardless of the product's score.
- For each option, explain its unique ethical strength in one concise sentence.
- Even if the evaluated product scores well, provide other ethical choices for consumers to consider.

Respond ONLY with a valid JSON object containing EXACTLY the following keys:
- "laborScore" (number from 0-10)
- "climateScore" (number from 0-10)
- "humanRightsScore" (number from 0-10)
- "laborExplanation" (ONE sentence about key labor factor)
- "climateExplanation" (ONE sentence about key environmental factor)
- "humanRightsExplanation" (ONE sentence about key human rights factor)
- "alternatives" (array of exactly 3 objects, each containing "name" and "reason" fields)

Example format:
{
  "laborScore": 7,
  "climateScore": 8,
  "humanRightsScore": 6,
  "laborExplanation": "Good working conditions but supplier oversight needs improvement.",
  "climateExplanation": "Strong renewable energy commitment with recyclable packaging.",
  "humanRightsExplanation": "No direct violations but supply chain monitoring is weak.",
  "alternatives": [
    {
      "name": "Better Brand A",
      "reason": "Industry leader in fair labor practices with fully transparent supply chain."
    },
    {
      "name": "Eco Company B",
      "reason": "Uses 100% renewable energy and biodegradable packaging."
    },
    {
      "name": "Ethical Corp C",
      "reason": "Certified B-Corporation with strong human rights track record."
    }
  ]
}

Do not include any text before or after the JSON object. ONLY RETURN THE JSON OBJECT.
`;

  const userPrompt = `Evaluate the following product/company: "${productName}"`;

  try {
    console.log(`Sending request to Gemini for: ${productName}`);
    
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: systemPrompt + "\n\n" + userPrompt,
    });
    
    const content = response.text;

    if (!content) {
      throw new Error("No content received from AI model.");
    }

    // Clean the content by removing Markdown code block syntax
    const cleanContent = content.replace(/^```json\n|\n```$/g, '').trim();

    // Parse the JSON response
    let aiResult: AIScoreResponse;
    try {
      aiResult = JSON.parse(cleanContent);

      // Basic validation
      if (
        typeof aiResult.laborScore !== "number" ||
        typeof aiResult.climateScore !== "number" ||
        typeof aiResult.humanRightsScore !== "number" ||
        typeof aiResult.laborExplanation !== "string" ||
        typeof aiResult.climateExplanation !== "string" ||
        typeof aiResult.humanRightsExplanation !== "string" ||
        !Array.isArray(aiResult.alternatives) ||
        !aiResult.alternatives.every(alt => 
          typeof alt === "object" && 
          alt !== null && 
          typeof alt.name === "string" && 
          typeof alt.reason === "string"
        )
      ) {
        throw new Error("Invalid JSON structure received from AI.");
      }
      
      // Ensure scores are within the valid range
      aiResult.laborScore = Math.min(10, Math.max(0, aiResult.laborScore));
      aiResult.climateScore = Math.min(10, Math.max(0, aiResult.climateScore));
      aiResult.humanRightsScore = Math.min(10, Math.max(0, aiResult.humanRightsScore));

    } catch (parseError) {
      console.error("Failed to parse JSON response from AI:", parseError);
      console.error("Raw AI response content:", content);
      throw new Error("AI model returned improperly formatted data.");
    }

    const responseData = {
      productName: productName,
      laborScore: aiResult.laborScore,
      climateScore: aiResult.climateScore,
      humanRightsScore: aiResult.humanRightsScore,
      laborExplanation: aiResult.laborExplanation,
      climateExplanation: aiResult.climateExplanation,
      humanRightsExplanation: aiResult.humanRightsExplanation,
      alternatives: aiResult.alternatives,
    };

    console.log(`Successfully processed score for: ${productName}`);
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error(`Error processing score for "${productName}":`, error);

    let errorMessage = "Failed to get ethical score.";
    let statusCode = 500;

    if (error.message.includes("AI model returned improperly formatted data")) {
      errorMessage = error.message;
      statusCode = 502;
    } else if (error.message.includes("No content received")) {
      errorMessage = error.message;
      statusCode = 502;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

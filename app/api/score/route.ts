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
  explanation: string;
  alternatives: string[];
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

Respond ONLY with a valid JSON object containing the following keys:
- "laborScore" (number from 0-10)
- "climateScore" (number from 0-10)
- "humanRightsScore" (number from 0-10)
- "explanation" (string with a brief explanation of the scores)
- "alternatives" (array of strings with up to 3 more ethical alternative products or companies)

Do not include any text before or after the JSON object.
`;

  const userPrompt = `Evaluate the following product/company: "${productName}"`;

  try {
    console.log(`Sending request to Gemini for: ${productName}`);
    
    const response = await genAI.models.generateContent({
      model: "gemini-pro",
      contents: systemPrompt + "\n\n" + userPrompt,
    });
    
    const content = response.text;

    if (!content) {
      throw new Error("No content received from AI model.");
    }

    // Parse the JSON response
    let aiResult: AIScoreResponse;
    try {
      aiResult = JSON.parse(content);

      // Basic validation
      if (
        typeof aiResult.laborScore !== "number" ||
        typeof aiResult.climateScore !== "number" ||
        typeof aiResult.humanRightsScore !== "number" ||
        typeof aiResult.explanation !== "string" ||
        !Array.isArray(aiResult.alternatives)
      ) {
        throw new Error("Invalid JSON structure received from AI.");
      }
      
      // Ensure scores are within the valid range
      aiResult.laborScore = Math.min(10, Math.max(0, aiResult.laborScore));
      aiResult.climateScore = Math.min(10, Math.max(0, aiResult.climateScore));
      aiResult.humanRightsScore = Math.min(10, Math.max(0, aiResult.humanRightsScore));
      
      aiResult.alternatives = aiResult.alternatives.filter(
        (alt): alt is string => typeof alt === "string",
      );

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
      explanation: aiResult.explanation,
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

// app/api/score/route.ts

import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize Gemini client using the API key from environment variables
const genAI = new GoogleGenAI({apiKey: process.env.GOOGLE_API_KEY || ""});

// Define the expected structure for the AI's response
interface AIScoreResponse {
  score: number;
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
You are an ethical product evaluator. Your task is to assess the ethical standing of a given product or company based on publicly available information regarding:
1.  **Climate Impact:** (e.g., carbon footprint, sustainable sourcing, packaging)
2.  **Employee Treatment:** (e.g., labor practices, wages, workplace safety, diversity)
3.  **Controversial Investments/Practices:** (e.g., involvement in weapons, fossil fuels, lobbying against environmental regulations, animal testing if applicable)

Based on your assessment, provide:
- A numerical score from 0 (very unethical) to 100 (very ethical).
- A brief explanation (2-3 sentences) justifying the score, mentioning the key factors considered.
- A list of up to 3 more ethical alternative products or companies, especially if the score is below 70. If no specific alternatives are readily known or the score is high, provide an empty list ([]).

Respond ONLY with a valid JSON object containing the following keys: "score" (number), "explanation" (string), and "alternatives" (array of strings). Do not include any text before or after the JSON object.
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
        typeof aiResult.score !== "number" ||
        typeof aiResult.explanation !== "string" ||
        !Array.isArray(aiResult.alternatives)
      ) {
        throw new Error("Invalid JSON structure received from AI.");
      }
      
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
      score: aiResult.score,
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

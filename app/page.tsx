// app/page.tsx
"use client"; // Required for using React hooks like useState

import { FormEvent, useState } from "react";

// Define a type for the score results (you can expand this later)
type ScoreResult = {
  productName: string;
  score: number | null;
  explanation: string;
  alternatives: string[];
};

export default function Home() {
  const [productInput, setProductInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Backend Interaction Placeholder ---
  // This function will eventually call your backend API
  const fetchEthicalScore = async (
    productName: string,
  ): Promise<ScoreResult> => {
    console.log(`Fetching score for: ${productName}`);
    setIsLoading(true);
    setError(null);
    setResult(null); // Clear previous results

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      // TODO: Replace this with an actual API call to your backend
      // Example:
      // const response = await fetch('/api/score', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ productName }),
      // });
      // if (!response.ok) {
      //   throw new Error('Failed to fetch score');
      // }
      // const data: ScoreResult = await response.json();
      // return data;

      // --- Placeholder Data ---
      // Remove this section when you implement the actual API call
      if (productName.toLowerCase().includes("error")) {
        throw new Error("Simulated API error.");
      }
      const mockScore = Math.floor(Math.random() * 101); // Random score 0-100
      const mockResult: ScoreResult = {
        productName: productName,
        score: mockScore,
        explanation: `This is a placeholder explanation for ${productName}. The score of ${mockScore} is based on simulated factors.`,
        alternatives:
          mockScore < 70
            ? [
                "Ethical Alternative A",
                "Sustainable Choice B",
                "Fair Trade Option C",
              ]
            : [],
      };
      // --- End Placeholder Data ---

      return mockResult; // Return placeholder data for now
    } catch (err) {
      console.error("Error fetching score:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
      // In case of error, return a default/error state object
      return {
        productName: productName,
        score: null,
        explanation: "Could not retrieve score.",
        alternatives: [],
      };
    } finally {
      setIsLoading(false);
    }
  };
  // --- End Backend Interaction Placeholder ---

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission page reload
    if (!productInput.trim()) {
      setError("Please enter a product or company name.");
      return;
    }
    const scoreData = await fetchEthicalScore(productInput);
    setResult(scoreData);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-16 bg-gray-900">
      <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">
          Ethical Product Scorer
        </h1>

        <form onSubmit={handleSubmit} className="mb-6">
          <label
            htmlFor="productInput"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Enter Product or Company Name:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="productInput"
              type="text"
              value={productInput}
              onChange={(e) => setProductInput(e.target.value)}
              placeholder="e.g., 'Brand X Chocolate Bar' or 'Company Y'"
              className="flex-grow px-4 py-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-700 text-white placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`px-6 py-2 rounded-md text-white font-semibold transition-colors duration-200 ease-in-out ${
                isLoading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={isLoading}
            >
              {isLoading ? "Checking..." : "Get Score"}
            </button>
          </div>
        </form>

        {/* --- Results Display Area --- */}
        {isLoading && (
          <div className="text-center text-gray-300">
            <p>Loading score...</p>
            {/* Optional: Add a spinner SVG or component here */}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-900 border border-red-700 text-red-200 rounded-md">
            <p>
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {result && !isLoading && (
          <div className="mt-6 p-6 border border-gray-700 rounded-lg bg-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Results for:{" "}
              <span className="font-bold">{result.productName}</span>
            </h2>

            {/* Placeholder for Score */}
            {result.score !== null ? (
              <div className="mb-4">
                <p className="text-lg text-gray-200">
                  <strong>Overall Ethics Score:</strong>
                  <span className="text-xl font-bold ml-2 text-blue-400">
                    {result.score} / 100
                  </span>
                </p>
                {/* TODO: Add detailed scores for climate, labor, etc. later */}
              </div>
            ) : (
              <p className="text-lg text-gray-400">Score not available.</p>
            )}

            {/* Placeholder for Explanation */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-1 text-gray-200">
                Explanation:
              </h3>
              <p className="text-gray-300">{result.explanation}</p>
              {/* TODO: Populate this with details from the OpenAI API response */}
            </div>

            {/* Placeholder for Alternatives */}
            {result.alternatives.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-1 text-gray-200">
                  Suggested Alternatives:
                </h3>
                <ul className="list-disc list-inside text-gray-300">
                  {result.alternatives.map((alt, index) => (
                    <li key={index}>{alt}</li>
                  ))}
                </ul>
                {/* TODO: Fetch and display actual alternatives */}
              </div>
            )}
            {result.alternatives.length === 0 && result.score !== null && (
              <p className="text-gray-400">
                No specific alternatives suggested based on this score.
              </p>
            )}
          </div>
        )}
        {/* --- End Results Display Area --- */}
      </div>
    </main>
  );
}

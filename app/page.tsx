// app/page.tsx
"use client"; // Required for using React hooks like useState

import { FormEvent, useState } from "react";

// Define a type for the score results
type ScoreResult = {
  productName: string;
  laborScore: number;
  climateScore: number;
  humanRightsScore: number;
  laborExplanation: string;
  climateExplanation: string;
  humanRightsExplanation: string;
  alternatives: string[];
};

// Circular progress component wrapped in a flippable card
const CircularProgress = ({ 
  score, 
  label, 
  color, 
  explanation 
}: { 
  score: number; 
  label: string; 
  color: string;
  explanation: string;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const safeScore = score ?? 0;
  const angle = (safeScore / 10) * 360;
  
  const createPieSlice = (percentage: number) => {
    const x = Math.cos((percentage - 90) * (Math.PI / 180)) * 50 + 50;
    const y = Math.sin((percentage - 90) * (Math.PI / 180)) * 50 + 50;
    const largeArc = percentage > 180 ? 1 : 0;
    return `M 50 50 L 50 0 A 50 50 0 ${largeArc} 1 ${x} ${y} Z`;
  };

  return (
    <div 
      className="w-64 h-64 perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front of card */}
        <div className="absolute w-full h-full flex flex-col items-center justify-center bg-gray-800 rounded-xl p-4 backface-hidden">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full absolute" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                className="text-gray-700"
                r="50"
                cx="50"
                cy="50"
                fill="currentColor"
              />
              {/* Pie slice */}
              {angle > 0 && (
                <path
                  className={`${color} transition-all duration-500 ease-in-out`}
                  d={createPieSlice(angle)}
                  fill="currentColor"
                />
              )}
            </svg>
            {/* Score text in the middle */}
            <span className="text-3xl font-bold text-white z-10">{safeScore.toFixed(1)}</span>
          </div>
          <span className="mt-4 text-lg font-medium text-white">{label}</span>
        </div>

        {/* Back of card */}
        <div className="absolute w-full h-full flex flex-col items-center justify-center bg-gray-800 rounded-xl p-6 backface-hidden rotate-y-180">
          <div className="text-white text-center">
            <h3 className="text-xl font-bold mb-4">{label}</h3>
            <p className="text-gray-300">{explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add required CSS styles at the top of your component
const styles = `
  .perspective-1000 {
    perspective: 1000px;
  }
  .transform-style-preserve-3d {
    transform-style: preserve-3d;
  }
  .backface-hidden {
    backface-visibility: hidden;
  }
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
`;

export default function Home() {
  // Add the styles to the document
  if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  const [productInput, setProductInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Backend Interaction ---
  const fetchEthicalScore = async (
    productName: string,
  ): Promise<ScoreResult> => {
    console.log(`Fetching score for: ${productName}`);
    setIsLoading(true);
    setError(null);
    setResult(null);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      // Uncomment this section when ready to use the actual API
      /*
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch score');
      }
      
      const data: ScoreResult = await response.json();
      return data;
      */

      if (productName.toLowerCase().includes("error")) {
        throw new Error("Simulated API error.");
      }
      
      // Generate random scores and category-specific explanations
      const mockResult: ScoreResult = {
        productName: productName,
        laborScore: Math.floor(Math.random() * 11),
        climateScore: Math.floor(Math.random() * 11),
        humanRightsScore: Math.floor(Math.random() * 11),
        laborExplanation: `This company has shown ${Math.random() > 0.5 ? 'good' : 'concerning'} labor practices, with particular focus on worker compensation and workplace safety standards.`,
        climateExplanation: `Environmental impact assessment shows ${Math.random() > 0.5 ? 'positive' : 'negative'} trends in carbon emissions and sustainable resource management.`,
        humanRightsExplanation: `Analysis of their global operations indicates ${Math.random() > 0.5 ? 'strong' : 'weak'} commitment to human rights and ethical business practices.`,
        alternatives: [
          "Ethical Alternative A",
          "Sustainable Choice B",
          "Fair Trade Option C",
        ],
      };
      
      return mockResult;
    } catch (err) {
      console.error("Error fetching score:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
      return {
        productName: productName,
        laborScore: 0,
        climateScore: 0,
        humanRightsScore: 0,
        laborExplanation: "",
        climateExplanation: "",
        humanRightsExplanation: "",
        alternatives: [],
      };
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="w-full max-w-4xl bg-gray-800 p-8 rounded-lg shadow-md">
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

            {/* Category Scores with Flippable Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <CircularProgress 
                score={result.laborScore} 
                label="Labor Ethics" 
                color="text-green-500"
                explanation={result.laborExplanation}
              />
              <CircularProgress 
                score={result.climateScore} 
                label="Climate Ethics" 
                color="text-blue-500"
                explanation={result.climateExplanation}
              />
              <CircularProgress 
                score={result.humanRightsScore} 
                label="Human Rights Ethics" 
                color="text-purple-500"
                explanation={result.humanRightsExplanation}
              />
            </div>

            {/* Alternatives */}
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
              </div>
            )}
            {result.alternatives.length === 0 && (
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

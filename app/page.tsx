// app/page.tsx
"use client"; // Required for using React hooks like useState

import { FormEvent, useEffect, useState } from "react";

// Define a type for the score results
type ScoreResult = {
  productName: string;
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
};

// Utility function for score colors
const getScoreColor = (score: number) => {
  if (score > 5.0) return "text-green-500";
  if (score < 5.0) return "text-red-500";
  return "text-gray-500";
};

// Circular progress component wrapped in a flippable card
const CircularProgress = ({ 
  score, 
  label, 
  explanation,
  isOverall = false
}: { 
  score: number; 
  label: string; 
  explanation: string;
  isOverall?: boolean;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const safeScore = score ?? 0;
  const angle = (safeScore / 10) * 360;
  
  const scoreColor = getScoreColor(safeScore);
  
  const createPieSlice = (percentage: number) => {
    const x = Math.cos((percentage - 90) * (Math.PI / 180)) * 50 + 50;
    const y = Math.sin((percentage - 90) * (Math.PI / 180)) * 50 + 50;
    const largeArc = percentage > 180 ? 1 : 0;
    return `M 50 50 L 50 0 A 50 50 0 ${largeArc} 1 ${x} ${y} Z`;
  };

  const containerClass = isOverall 
    ? "w-80 h-80 perspective-1000 cursor-pointer" 
    : "w-64 h-64 perspective-1000 cursor-pointer";
  
  const circleClass = isOverall
    ? "relative w-56 h-56 flex items-center justify-center"
    : "relative w-40 h-40 flex items-center justify-center";
  
  const scoreClass = isOverall
    ? "text-5xl font-bold text-white z-10"
    : "text-3xl font-bold text-white z-10";

  return (
    <div 
      className={containerClass}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front of card */}
        <div className="absolute w-full h-full flex flex-col items-center justify-center bg-gray-800 rounded-xl p-4 backface-hidden">
          <div className={circleClass}>
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
                  className={`${scoreColor} transition-all duration-500 ease-in-out`}
                  d={createPieSlice(angle)}
                  fill="currentColor"
                />
              )}
            </svg>
            {/* Score text in the middle */}
            <span className={scoreClass}>{safeScore.toFixed(1)}</span>
          </div>
          <span className={`mt-4 ${isOverall ? 'text-2xl' : 'text-lg'} font-bold text-white`}>{label}</span>
        </div>

        {/* Back of card */}
        <div className="absolute w-full h-full flex flex-col items-center justify-center bg-gray-800 rounded-xl p-6 backface-hidden rotate-y-180">
          <div className="text-white text-center">
            <h3 className={`${isOverall ? 'text-2xl' : 'text-xl'} font-bold mb-4`}>{label}</h3>
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

// Add Tenor script to the document
const addTenorScript = () => {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = 'https://tenor.com/embed.js';
  document.body.appendChild(script);
};

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

  // Add Tenor script when component mounts
  useEffect(() => {
    addTenorScript();
  }, []);

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
          { name: "Ethical Alternative A", reason: "This alternative is known for its strong commitment to labor rights and fair wages." },
          { name: "Sustainable Choice B", reason: "This choice is known for its positive impact on the environment and sustainable practices." },
          { name: "Fair Trade Option C", reason: "This option is known for its strong commitment to human rights and ethical business practices." },
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

            {/* Overall Ethical Score */}
            <div className="flex justify-center mb-12">
              <CircularProgress 
                score={(result.laborScore + result.climateScore + result.humanRightsScore) / 3} 
                label="Ethical Score"
                explanation={`Average of Labor (${result.laborScore}), Climate (${result.climateScore}), and Human Rights (${result.humanRightsScore}) scores.`}
                isOverall={true}
              />
            </div>

            {/* Score-based GIF display */}
            {((result.laborScore + result.climateScore + result.humanRightsScore) / 3) >= 5.0 ? (
              <div className="flex justify-center mb-12">
                <iframe 
                  src="https://giphy.com/embed/WtOkaikiwaR87ZvAFH" 
                  width="384" 
                  height="384" 
                  className="rounded-lg"
                  frameBorder="0" 
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex justify-center mb-12">
                <img 
                  src="https://i.makeagif.com/media/11-18-2020/nTfLo7.gif"
                  alt="Red Alert Warning Light" 
                  className="w-96 h-96 object-contain rounded-lg"
                />
              </div>
            )}

            {/* Category Score Breakdown */}
            <h3 className="text-xl font-semibold mb-4 text-white text-center">Category Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <CircularProgress 
                score={result.laborScore} 
                label="Labor Ethics" 
                explanation={result.laborExplanation}
              />
              <CircularProgress 
                score={result.climateScore} 
                label="Climate Ethics" 
                explanation={result.climateExplanation}
              />
              <CircularProgress 
                score={result.humanRightsScore} 
                label="Human Rights Ethics" 
                explanation={result.humanRightsExplanation}
              />
            </div>

            {/* Alternatives */}
            <div className="mt-12 pt-8 border-t-2 border-gray-600">
              <h3 className="text-2xl font-bold mb-2 text-white text-center">
                Other Ethical Options
              </h3>
              <p className="text-gray-300 text-center mb-8">
                Consider these other ethical choices in this category
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {result.alternatives.map((alt, index) => (
                  <div 
                    key={index}
                    className="bg-gray-800 rounded-xl p-6 transform transition-transform duration-300 hover:scale-105 hover:shadow-xl border border-gray-700"
                  >
                    <div className="flex items-center mb-4">
                      <div className={`w-8 h-8 ${getScoreColor(8).replace('text-', 'bg-')} rounded-full flex items-center justify-center mr-3`}>
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <h4 className="text-xl font-semibold text-white">{alt.name}</h4>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{alt.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* --- End Results Display Area --- */}
      </div>
    </main>
  );
}

import { useState } from "react";

// ✅ Fetch API key from .env (must start with VITE_)
const API_KEY="AIzaSyCV8vHf5I22YijDmOodKnFpLmHZSyqKd6g";

function App() {
  const [value, setValue] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setValue(e.target.value);

  const handleSubmit = async () => {
    if (!value.trim()) return;

    setLoading(true);
    setResponse("");

    try {
      // ✅ Call Gemini API directly (like Postman)
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: value+"modify this prompt so it is understood by an image generating model" }],
              },
            ],
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();

      // ✅ Extract model response safely
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ No response from Gemini";

      setResponse(text);
    } catch (error) {
      console.error(error);
      setResponse("❌ Error fetching response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Story Board Generator
      </h1>

      <div className="flex space-x-3 w-full max-w-md">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Enter your prompt..."
          className="flex-1 px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl shadow hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </div>

      {response && (
        <div className="mt-6 p-4 bg-white rounded-xl shadow-md w-full max-w-md text-gray-800 whitespace-pre-wrap">
          {response}
        </div>
      )}
    </div>
  );
}

export default App;

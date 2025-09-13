import { useState } from "react";
import { GEMINI_API_KEY } from "./config";
//import { generateImagesForScenes } from "./image";

function App() {
  const [value, setValue] = useState("");
  const [story, setStory] = useState("");
  const [character, setCharacter] = useState(""); // 🔹 Dynamic character
  const [scenes, setScenes] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visualizing, setVisualizing] = useState(false);

  const handleChange = (e) => setValue(e.target.value);

  // Step 1: Generate Story
  const handleSubmit = async () => {
    if (!value.trim()) return;
    setLoading(true);
    setStory("");

    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: value + " Write a short simple story with 10-12 lines only" }] }],
          }),
        }
      );

      const data = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ No story generated";
      setStory(text);

      // Step 2: Identify Main Character
      await extractCharacter(text);
    } catch (error) {
      console.error(error);
      setStory("❌ Error generating story");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Extract character details from story
  const extractCharacter = async (storyText) => {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Read the following story and give the main character's name and a short physical description in one line. Only return the character details, nothing else:\n${storyText}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await res.json();
      const charText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Unnamed character with no description";
      setCharacter(charText);
    } catch (error) {
      console.error("Character extraction error:", error);
    }
  };

  // Step 3: Split Story into Scenes and Generate Images
  const handleVisualize = async () => {
    if (!story || !character) return;
    setVisualizing(true);

    try {
      // Split story into scenes
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Split this story into clear scenes like Scene 1, Scene 2, Scene 3 with descriptive 2-3 lines:\n${story}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await res.json();
      const sceneText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const sceneList = sceneText.split(/\n+/).filter((s) => s.trim() !== "");
      setScenes(sceneList);

      // Step 4: Generate images using dynamic character + scenes
      const imgs = await generateImagesForScenes(sceneList, character);
      setImages(imgs);
    } catch (error) {
      console.error("Scene splitting error:", error);
    } finally {
      setVisualizing(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Story Board Generator</h1>

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
          className="px-6 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </div>

      {story && (
        <div className="mt-6 p-4 bg-white rounded-xl shadow-md w-full max-w-md text-gray-800 whitespace-pre-wrap">
          {story}
        </div>
      )}

      {character && (
        <div className="mt-4 p-2 bg-yellow-100 rounded-lg text-gray-800 font-medium">
          Character: {character}
        </div>
      )}

      {story && character && (
        <button
          onClick={handleVisualize}
          disabled={visualizing}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition disabled:opacity-50"
        >
          {visualizing ? "Generating Images..." : "Visualize Story"}
        </button>
      )}

      {images.length > 0 && (
        <div className="mt-6 w-full max-w-2xl">
          {images.map((img, idx) => (
            <div key={idx} className="mb-6">
              <h2 className="font-bold mb-2">{img.scene}</h2>
              <img
                src={img.url}
                alt={`Scene ${idx + 1}`}
                className="rounded-xl shadow-md w-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;

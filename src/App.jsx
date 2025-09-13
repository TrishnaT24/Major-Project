import { useState } from "react";
import { generateImagesForScenes } from "./image";

const API_KEY = "AIzaSyCV8vHf5I22YijDmOodKnFpLmHZSyqKd6g";

function App() {
  const [value, setValue] = useState("");
  const [story, setStory] = useState("");
  const [scenePrompts, setScenePrompts] = useState([]);
  const [imageResults, setImageResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);

  const handleChange = (e) => setValue(e.target.value);

  const handleSubmit = async () => {
    if (!value.trim()) return;

    setLoading(true);
    setStory("");
    setScenePrompts([]);
    setImageResults([]);

    try {
      // Step 1: Generate story
      const storyRes = await fetch(
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
                parts: [{ text: `${value} Write a short simple story of 10-12 lines.` }],
              },
            ],
          }),
        }
      );

      const storyData = await storyRes.json();
      const shortStory = storyData?.candidates?.[0]?.content?.parts?.[0]?.text || "No story generated";
      setStory(shortStory);

      // Step 2: Split into image-ready scenes
      const sceneRes = await fetch(
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
                parts: [
                  {
                    text: `Take the story below and do the following:

1. Identify all main characters. For each character, write a one-line description and define it in a variable like for example:
   ronak = "description"
   jheel = "description"

2. Split the story into multiple scenes: Scene 1, Scene 2, etc.

3. For each scene, write a short, clear prompt for image generation:
   - Start with character variables instead of real names (like {ronak}, {jheel}).
   - Describe setting (place, time, mood) in simple words.
   - Describe actions happening and important objects.

4. Output only:
   - Character definitions first.
   - Then each scene labeled as "Scene 1:", "Scene 2:", etc(But note try to make 3 to 4 scenes only).
   - Make sure prompts are simple and easy for an image model to understand.

Story:
"YOUR_STORY"


"${shortStory}"`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const sceneData = await sceneRes.json();
      const rawScenes = sceneData?.candidates?.[0]?.content?.parts?.[0]?.text || "No scenes generated";

      // Split scenes cleanly based on "Scene" keyword
      const sceneList = rawScenes.split(/Scene\s+\d+:/).filter((s) => s.trim() !== "");
      const finalScenes = sceneList.map((s, i) => `Scene ${i + 1}:${s.trim()}`);
      setScenePrompts(finalScenes);
    } catch (error) {
      console.error(error);
      setStory("Error generating story or scenes.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Generate images for scenes
  const handleGenerateImages = async () => {
    if (scenePrompts.length === 0) return;

    setLoadingImages(true);
    setImageResults([]);
    try {
      const results = await generateImagesForScenes(scenePrompts);
      setImageResults(results);
    } catch (err) {
      console.error("Image generation failed:", err);
    } finally {
      setLoadingImages(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Story Board Generator</h1>

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
          {loading ? "Loading..." : "Generate"}
        </button>
      </div>

      {story && (
        <div className="mt-6 p-4 bg-white rounded-xl shadow-md w-full max-w-md text-gray-800 whitespace-pre-wrap">
          <h2 className="text-xl font-bold mb-2">Generated Story:</h2>
          {story}
        </div>
      )}

      {scenePrompts.length > 0 && (
        <div className="mt-6 p-4 bg-white rounded-xl shadow-md w-full max-w-md text-gray-800 whitespace-pre-wrap">
          <h2 className="text-xl font-bold mb-2">Image-Ready Scene Prompts:</h2>
          {scenePrompts.map((scene, idx) => (
            <div key={idx} className="mb-3">
              <strong>{scene}</strong>
            </div>
          ))}

          <div className="mt-4">
            <button
              onClick={handleGenerateImages}
              disabled={loadingImages}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-xl shadow hover:bg-green-700 transition disabled:opacity-50"
            >
              {loadingImages ? "Generating Images..." : "Visualize Scenes"}
            </button>
          </div>
        </div>
      )}

      {imageResults.length > 0 && (
        <div className="mt-6 p-4 bg-white rounded-xl shadow-md w-full max-w-md">
          <h2 className="text-xl font-bold mb-2">Generated Images:</h2>
          {imageResults.map((item, i) => (
            <div key={i} className="mb-4">
              <h3 className="font-semibold mb-1">{item.scene}</h3>
              <img src={item.url} alt={`Scene ${i + 1}`} className="rounded-lg shadow" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;

import { FLUX_API_KEY } from "./config";

// Small delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Parse character definitions dynamically
function parseCharacters(rawData) {
  const characterLines = rawData.match(/^\s*\w+\s*=\s*".*"/gm) || [];
  const characters = {};
  characterLines.forEach(line => {
    const [name, desc] = line.split("=");
    if (name && desc) {
      characters[name.trim()] = desc.trim().replace(/^"|"$/g, "");
    }
  });
  return characters;
}

// Replace placeholders with real character descriptions
function replaceCharacters(scene, characters) {
  let finalScene = scene;
  Object.keys(characters).forEach(char => {
    const regex = new RegExp(`{${char}}`, "g");
    finalScene = finalScene.replace(regex, characters[char]);
  });
  return finalScene;
}

export async function generateImagesForScenes(sceneData) {
  const imageResults = [];
  const characters = parseCharacters(sceneData.join("\n")); // dynamic characters
  const scenes = sceneData.filter(line => line.startsWith("Scene")); // only scenes

  for (const scene of scenes) {
    let finalPrompt = replaceCharacters(scene, characters); // replace before sending
    let attempts = 0, success = false, imageUrl = null;

    while (attempts < 3 && !success) {
      try {
        const res = await fetch("https://api.together.xyz/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${FLUX_API_KEY}`,
          },
          body: JSON.stringify({
            model: "black-forest-labs/FLUX.1-schnell",
            prompt: "3d image of " + finalPrompt,
            n: 1,
          }),
        });

        if (res.status === 429 || res.status === 500) {
          console.warn("Retrying after delay...");
          await delay(2000);
          attempts++;
          continue;
        }

        const data = await res.json();
        imageUrl = data?.data?.[0]?.url || null;
        if (imageUrl) {
          success = true;
          imageResults.push({ scene, url: imageUrl });
        }

      } catch (error) {
        console.error("Image generation error:", error);
        await delay(1500);
        attempts++;
      }
    }

    if (!success) {
      console.error(`Failed to generate image for scene after retries: ${scene}`);
    }

    await delay(3000); // prevent rate limit
  }

  return imageResults;
}

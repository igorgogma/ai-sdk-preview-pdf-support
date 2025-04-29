// Simple test script for Replicate API
const Replicate = require('replicate');

// Get API key from .env.local
require('dotenv').config({ path: '.env.local' });

async function testReplicateAPI() {
  console.log("Testing Replicate API...");
  
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) {
    console.error("Replicate API key not found in .env.local");
    return;
  }
  
  console.log("API Key found:", apiKey.substring(0, 5) + "...");
  
  try {
    const replicate = new Replicate({
      auth: apiKey,
    });
    console.log("Initialized Replicate client");
    
    // Use Llama 3 model
    const model = "meta/llama-3-70b-instruct:2d19859030ff705a87c746f7e96eea03aefb71f166725aee39692f1476566d48";
    console.log("Using model:", model);
    
    console.log("Running prediction...");
    const input = { 
      prompt: "Generate a simple JSON object with a 'message' field that says 'Hello from Replicate API'",
      system_prompt: "You are a helpful assistant that responds in JSON format."
    };
    
    const output = await replicate.run(model, { input });
    
    console.log("Prediction successful!");
    console.log("Response:", output);
    
    try {
      // If output is a string, try to parse it as JSON
      if (typeof output === 'string') {
        const json = JSON.parse(output);
        console.log("Parsed JSON:", json);
      } else {
        console.log("Output is not a string, but:", typeof output);
      }
    } catch (error) {
      console.error("Failed to parse response as JSON:", error);
    }
    
  } catch (error) {
    console.error("Error testing Replicate API:", error);
  }
}

testReplicateAPI();

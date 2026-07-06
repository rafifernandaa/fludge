import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent for telemetry as required by guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API routes FIRST
app.post("/api/gemini/advisor", async (req, res) => {
  try {
    const { rtDetails, selectedSensor, activePresetName } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY environment variable is missing on the server. Please check the Secrets panel in Settings." 
      });
    }

    const prompt = `
You are the AI Tactical Disaster Advisor integrated into the BPBD DKI Jakarta Flash-Flood Command Center system.
Your role is to analyze real-time hydrological risk data and generate a clear, highly professional tactical action brief for emergency response.

Context & Current Scenario:
- Simulation Scenario: ${activePresetName}
- Selected Neighborhood Sector: RT ${rtDetails.rt_id} (Kelurahan: ${rtDetails.kelurahan})
- Neighborhood Elevation: ${rtDetails.demnas_elevation_m} meters (DEMNAS high-resolution terrain)
- Local Rainfall Intensity: ${rtDetails.interpolated_rainfall_mm_hr.toFixed(1)} mm/hr (BMKG interpolated data)
- Evacuation Exceedance Probability: ${(rtDetails.evt_exceedance_prob * 100).toFixed(1)}% (Extreme Value Theory floodgate probability)
- Overall Composite Risk Index: ${rtDetails.risk_priority_score.toFixed(4)} (weighted composite)
- Associated River Monitoring Station: ${selectedSensor.name}
- River Sensor Water Level: ${selectedSensor.water_level_cm.toFixed(1)} cm (Status: ${
      selectedSensor.exceedance_prob > 0.8 ? "SIAGA 1 (SEVERE)" :
      selectedSensor.exceedance_prob > 0.5 ? "SIAGA 2 (HIGH)" :
      selectedSensor.exceedance_prob > 0.2 ? "SIAGA 3 (WARNING)" : "SIAGA 4 (NORMAL)"
    })

Evacuation Path (Dijkstra optimal path to safety):
- Safest Refuge/Muster Point (optimal Haven): ${rtDetails.musterPointName || "Kelurahan High Ground"}
- Total Path Distance: ${rtDetails.pathDistanceKm ? rtDetails.pathDistanceKm.toFixed(2) + " km" : "N/A"}
- Path Safety Rating: ${rtDetails.routeSafetyScore || "N/A"}%

Your brief must be concise (max 180 words), in professional English, structured with clean layout elements, and directly address the Chief of Disaster Operations (Ibu Kartini). 
Include:
1. **Critical Threat Assessment**: Highlight if the risk is extreme or manageable based on elevations, GEV exceedance, and rainfall.
2. **Immediate Tactical Directives**: State whether to deploy drainage pumps, sound sirens, or begin mandatory evacuation.
3. **Optimized Evacuation Route guidance**: Advise on using the Dijkstra-calculated route to the optimal shelter and warn if any parts are compromised.

Be direct, authoritative, and helpful. Use clear headings or markdown. Keep it very professional.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Indonesian Hydrological Engineer and Chief Emergency Coordinator speaking to BPBD disaster response commanders. Always write in a concise, structured, action-oriented, and professional tone.",
        temperature: 0.3,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Advisor Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI advice" });
  }
});

// Serve Vite dev server or static files
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite();

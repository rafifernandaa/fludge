import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type, Schema } from "@google/genai";
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
      "User-Agent": "aistudio-build",
    },
  },
});

const tacticalBriefSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    metadata: {
      type: Type.OBJECT,
      properties: {
        to: { type: Type.STRING },
        subject: { type: Type.STRING },
      },
    },
    threatAssessment: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.STRING,
          enum: ["CRITICAL", "HIGH", "MODERATE", "LOW"],
        },
        description: { type: Type.STRING },
      },
    },
    tacticalDirectives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING },
          details: { type: Type.STRING },
        },
      },
    },
  },
  required: ["metadata", "threatAssessment", "tacticalDirectives"],
};

// API routes FIRST
app.post("/api/gemini/advisor", async (req, res) => {
  try {
    const { rtDetails, selectedSensor, activePresetName } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error:
          "GEMINI_API_KEY environment variable is missing on the server. Please check the Secrets panel in Settings.",
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
      selectedSensor.exceedance_prob > 0.8
        ? "SIAGA 1 (SEVERE)"
        : selectedSensor.exceedance_prob > 0.5
          ? "SIAGA 2 (HIGH)"
          : selectedSensor.exceedance_prob > 0.2
            ? "SIAGA 3 (WARNING)"
            : "SIAGA 4 (NORMAL)"
    })

Evacuation Path (Dijkstra optimal path to safety):
- Safest Refuge/Muster Point (optimal Haven): ${rtDetails.musterPointName || "Kelurahan High Ground"}
- Total Path Distance: ${rtDetails.pathDistanceKm ? rtDetails.pathDistanceKm.toFixed(2) + " km" : "N/A"}
- Path Safety Rating: ${rtDetails.routeSafetyScore || "N/A"}%

Output a structured JSON response matching the schema.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are an expert Indonesian Hydrological Engineer and Chief Emergency Coordinator speaking to BPBD disaster response commanders. Always write in a concise, structured, action-oriented, and professional tone.",
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: tacticalBriefSchema,
      },
    });

    // Extract text and parse safely
    const data = JSON.parse(response.text || "{}");
    res.json({ data });
  } catch (error: any) {
    console.error("Gemini Advisor Error:", error);

    // Fallback to mock data if quota exceeded or other API error occurs
    console.log("Providing fallback mock data due to API error.");
    const fallbackData = {
      metadata: {
        to: "BPBD Command Center",
        subject: "TACTICAL BRIEF [AUTO-FALLBACK]",
      },
      threatAssessment: {
        level:
          req.body.rtDetails?.risk_priority_score > 0.7
            ? "CRITICAL"
            : req.body.rtDetails?.risk_priority_score > 0.4
              ? "HIGH"
              : "MODERATE",
        description:
          "AI API Quota Limit Reached. This is a deterministic fallback assessment based on the composite risk score.",
      },
      tacticalDirectives: [
        {
          action: "MONITOR & DISPATCH",
          details:
            "Initiate standard operating procedures for the current risk level. Monitor water levels closely.",
        },
        {
          action: "COMMUNICATION",
          details:
            "Maintain radio contact with neighborhood response teams and stand by for AI system restoration.",
        },
      ],
    };

    res.json({ data: fallbackData });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite();

import axios from "axios";
import { searchAndSavePlaces, generateRouteWithPoints } from "../services/placesService.js";

export const searchPlaces = async (req, res) => {
  const { lat, lng, tipo } = req.query;

  if (!lat || !lng || !tipo) {
    return res.status(400).json({ error: "Parâmetros obrigatórios: lat, lng, tipo" });
  }

  try {
    const resultados = await searchAndSavePlaces(lat, lng, 20000, [tipo]);
    res.json(resultados);
  } catch (error) {
    console.error("Erro ao buscar lugares:", error.message);
    res.status(500).json({ error: "Erro ao buscar lugares" });
  }
};

export const createRoute = async (req, res) => {
  try {
    const lat = 37.1291787;
    const lon = -8.5941054;

    const pontos = await generateRouteWithPoints(lat, lon);

    if (!pontos || pontos.length < 2) {
      return res.status(400).json({ error: "Não foi possível gerar pontos suficientes." });
    }

    const waypoints = pontos.slice(1, -1).map((p) => ({
      location: `${p.lat},${p.lon}`,
      stopover: true,
    }));

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/directions/json",
      {
        params: {
          origin: `${pontos[0].lat},${pontos[0].lon}`,
          destination: `${pontos[pontos.length - 1].lat},${pontos[pontos.length - 1].lon}`,
          waypoints: waypoints.map((w) => w.location).join("|"),
          optimizeWaypoints: true,
          travelMode: "DRIVING",
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Erro ao gerar rota:", err.message);
    res.status(500).json({ error: "Erro ao gerar rota" });
  }
};

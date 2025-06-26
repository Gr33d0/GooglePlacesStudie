import axios from "axios";
import pool from "../config/db.js";
import { normalizePlaceData } from "../utils/normalizePlaceData.js";
import env from "dotenv";
import { ordenarPontos } from "../utils/calculateDistance.js";
env.config();

export async function searchAndSavePlaces(lat, lng, radius, tipo) {
  const resposta = await axios.get(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
    {
      params: {
        location: `${lat},${lng}`,
        radius: radius,
        type: tipo,
        key: process.env.GOOGLE_API_KEY,
      },
    }
  );

  const todosLugares = resposta.data.results;
  const melhores = selectPlaces(todosLugares, 5);
  await savePlaces(melhores);

  return melhores;
}

function selectPlaces(lugares, quantidade = 5) {
  return lugares
    .filter((l) => l.rating !== undefined)
    .sort(
      (a, b) =>
        b.rating - a.rating || b.user_ratings_total - a.user_ratings_total
    )
    .slice(0, quantidade);
}

async function savePlaces(lugares) {
  for (const lugar of lugares) {
    const normalized = normalizePlaceData(lugar);

    const lat = normalized[1]; // location_lat
    const lng = normalized[2]; // location_lng

    // Verifica se lat/lng existem
    if (lat === null || lng === null) {
      console.warn(`[IGNORADO] Lugar sem coordenadas: ${normalized[10]}`);
      continue;
    }

    const geog = `SRID=4326;POINT(${lng} ${lat})`; // lng primeiro!

    try {
      await pool.query(
        `
        INSERT INTO places (
          business_status,
          location_lat,
          location_lng,
          viewport_northeast_lat,
          viewport_northeast_lng,
          viewport_southwest_lat,
          viewport_southwest_lng,
          icon,
          icon_background_color,
          icon_mask_base_uri,
          name,
          opening_now,
          photos,
          place_id,
          plus_code_compound,
          plus_code_global,
          price_level,
          rating,
          reference,
          scope,
          types,
          user_ratings_total,
          vicinity,
          geog
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22, $23, ST_GeogFromText($24)
        )
        ON CONFLICT (place_id) DO NOTHING
        `,
        [...normalized, geog]
      );
    } catch (error) {
      console.error(`Erro ao inserir lugar ${lugar.name}:`, error.message);
    }
  }
}


const touristFriendlyPlaces = [
  "restaurant", "museum", "park", "cafe", "tourist_attraction"
];

async function getPlacesWithinRadius(lat, lng, radius, types) {
  const query = `
     SELECT name,
           ST_Distance(
               geog,
               ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
           ) AS distancia_metros,
           location_lat,
           location_lng
    FROM places
    WHERE ST_Distance(
            geog,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          ) <= $3
      AND $4 = ANY(types)
    ORDER BY distancia_metros
    LIMIT 1;
  `;

  const values = [lng, lat, radius, types];

  try {
    let { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      await searchAndSavePlaces(lat, lng, radius, types);
      ({ rows } = await pool.query(query, values));
    }

    return rows;
  } catch (error) {
    console.error("Erro ao buscar lugares:", error);
    throw error;
  }
}

export async function generateRouteWithPoints(lat1, lon1) {
  const points = [];
  points.push({ lat: lat1, lon: lon1 }); // origem

  let currentIndex = 1;
  let tentativas = 0;

  while (points.length <= 5 && tentativas < 100) {
    const currentPoint = points[points.length - 1];
    let raio = 100 * 1000; //km ;
    let pontoEncontrado = false;
    let tentativasTipo = 0;

    while (!pontoEncontrado && tentativasTipo < 10) {
      const tiposTentativa = [...touristFriendlyPlaces];
      while (tiposTentativa.length > 0 && !pontoEncontrado) {
        let i = Math.floor(Math.random() * tiposTentativa.length);
        let type = tiposTentativa.splice(i, 1)[0];
 

        try {
          console.log(`[BUSCA] tipo "${type}" dentro de ${raio / 1000}km`);
          const result = await getPlacesWithinRadius(
            currentPoint.lat,
            currentPoint.lon,
            raio,
            type
          );

          const point = result[0];
          if (point) {
            const jaExiste = points.some(
              (p) => p.lat === point.location_lat && p.lon === point.location_lng
            );

            if (!jaExiste) {
              points.push({
                lat: point.location_lat,
                lon: point.location_lng,
              });
              pontoEncontrado = true;
              currentIndex++;
            }
          }
        } catch (err) {
          console.error(`[ERRO] tipo "${type}" em (${currentPoint.lat}, ${currentPoint.lon}):`, err.message);
        }
      }

      if (!pontoEncontrado) {
        tentativasTipo++;
        raio = Math.min(raio + 10000, 100000);
      }
    }

    tentativas++;
  }

  if (points.length < 6) {
    console.log("[DEBUG] Pontos encontrados:", points);
    throw new Error("Não foi possível encontrar pontos suficientes.");
  }

  return ordenarPontos(points);
}

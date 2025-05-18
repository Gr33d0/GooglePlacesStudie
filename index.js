const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.get('/buscar-lugares', async (req, res) => {
  const { lat, lng, tipo } = req.query;

  try {
    const resposta = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: `${lat},${lng}`,
        radius: 2000,
        type: tipo,
        key: process.env.GOOGLE_API_KEY
      }
    });

    const todosLugares = resposta.data.results;
    const melhores = selecionarMelhoresLugares(todosLugares, 5);

    res.json(melhores);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar lugares');
  }
});


function selecionarMelhoresLugares(lugares, quantidade = 5) {
  return lugares
    .filter(l => l.rating !== undefined)
    .sort((a, b) => b.rating - a.rating || b.user_ratings_total - a.user_ratings_total)
    .slice(0, quantidade);
}



app.post('/gerar-rota', express.json(), async (req, res) => {
  const pontos = req.body.pontos; // lista de locais selecionados

  if (!pontos || pontos.length < 2) {
    return res.status(400).json({ error: 'Pelo menos dois pontos são necessários' });
  }

  const origin = `${pontos[0].geometry.location.lat},${pontos[0].geometry.location.lng}`;
  const destination = `${pontos[pontos.length - 1].geometry.location.lat},${pontos[pontos.length - 1].geometry.location.lng}`;
  const waypoints = pontos.slice(1, -1)
    .map(p => `${p.geometry.location.lat},${p.geometry.location.lng}`)
    .join('|');

  try {
    const resposta = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin,
        destination,
        waypoints: waypoints ? `optimize:true|${waypoints}` : undefined,
        key: process.env.GOOGLE_API_KEY
      }
    });

    res.json(resposta.data.routes[0]); // envia a rota calculada
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao gerar rota' });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

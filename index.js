import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import mapRoutes from './routes/mapRoutes.js';
const app = express();
const PORT = 3000;
dotenv.config();
app.use(cors());
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.send('Teste para encontrar pontos de uma determinada localizaçao http://localhost:3000/buscar-lugares?lat=37.1299548&lng=-8.5828056&tipo=restaurant');
  //37.1299548,-8.5828056
});
app.use('/mapas', mapRoutes);









app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
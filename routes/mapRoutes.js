import express from 'express';
import { searchPlaces,createRoute } from '../controllers/mapsController.js';

const router = express.Router();

router.get("/search", searchPlaces);//adicionar verifyFirebaseToken depois 
router.get("/createRoute", createRoute);//adicionar verifyFirebaseToken depois

export default router;
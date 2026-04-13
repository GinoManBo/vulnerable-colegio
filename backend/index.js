import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get('/', () => {
    res.send('Servidor corriendo');
});
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { promptRoutes } from './routes/promptRoutes';
import { essayRoutes } from './routes/essayRoutes';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/prompts', promptRoutes);
app.use('/api/essays', essayRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

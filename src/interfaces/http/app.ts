import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/error-handler.js';
import { env } from '../../config/env.js';
import { createPool } from '../../infrastructure/db/pool.js';
import { createHealthRouter } from './routes/health.js';

const app = express();
const pool = createPool();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1', createHealthRouter(pool, env.ENVIRONMENT));

app.use((_req, _res, next) => {
  next(Object.assign(new Error('Route not found'), { code: 'not_found' }));
});

app.use(errorHandler);

export { app };

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'personal-budget-api' });
});

app.use(
  (
    err: Error & { status?: number; details?: unknown },
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    const status = err.status ?? 500;

    res.status(status).json({
      error: {
        code: status === 500 ? 'internal_error' : 'request_error',
        message: err.message || 'Unexpected error',
        details: err.details ?? null
      }
    });
  }
);

export { app };

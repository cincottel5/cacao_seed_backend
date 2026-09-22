import 'dotenv/config';
import { app } from './app.js';

const port = Number(process.env.PORT ?? '3000');

export const startServer = () => {
  return app.listen(port, () => {
    console.log(`Personal budget API listening on port ${port}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

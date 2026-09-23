import { env } from '../../config/env.js';
import { app } from './app.js';

export const startServer = () => {
  return app.listen(env.PORT, () => {
    console.log(`Personal budget API listening on port ${env.PORT}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

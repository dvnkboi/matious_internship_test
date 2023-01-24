import express from 'express';
import routes from './Routes/api';
import cors from 'cors';

const app = express();

app.use(cors());

app.use(express.json());

app.use('/api/v1', routes);

export default app;
export {
  app
};
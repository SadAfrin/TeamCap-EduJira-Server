import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());

// Test route
app.get('/', (req: Request, res: Response) => {
  res.send({
    success: true,
    message: 'Edujira Server is running successfully!',
  });
});

export default app;
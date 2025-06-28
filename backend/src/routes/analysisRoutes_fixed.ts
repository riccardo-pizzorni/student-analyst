import { Router } from 'express';

export const analysisRoutes = Router();

// Placeholder route
analysisRoutes.get('/', (req, res) => {
  res.json({ message: 'Analysis route placeholder' });
});

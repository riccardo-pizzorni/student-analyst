import { Router } from 'express';

export const apiRoutes = Router();

// Placeholder route
apiRoutes.get('/', (req, res) => {
  res.json({ message: 'API route placeholder' });
});


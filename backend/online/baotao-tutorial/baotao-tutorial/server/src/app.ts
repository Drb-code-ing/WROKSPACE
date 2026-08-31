import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import capsuleRoutes from './routes/capsule';
import { testConnection } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/capsules', capsuleRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const startServer = async () => {
  try {
    // Test database connection before starting
    await testConnection();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API endpoint: http://localhost:${PORT}/api/capsules\n`);
    });
  } catch (error: any) {
    console.error('\n❌ Failed to start server:');
    console.error(error.message);
    process.exit(1);
  }
};

startServer();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import testRoutes from './routes/test.routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log response bodies
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    console.log('\nResponse Body:', JSON.stringify(body, null, 2));
    return originalJson.call(this, body);
  };
  next();
});

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Accessibility Analyzer API' });
});

// Routes (uncomment when routes are
//  created)
app.use('/api/test', testRoutes);
// app.use('/api/test', testRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI as string )
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;

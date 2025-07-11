import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import registrationRoutes from './routes/registrations.js';
import orderRoutes from './routes/orders.js';
import meetingLinkRoutes from './routes/meetingLinks.js';
import paymentRoutes from './routes/payments.js';
import webinar from './routes/webinar.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB with fallback
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.log('❌ MongoDB connection failed. Using in-memory storage for demo.');
    console.log('💡 To use MongoDB:');
    console.log('   1. Install MongoDB locally, OR');
    console.log('   2. Create free MongoDB Atlas account, OR');
    console.log('   3. Update MONGODB_URI in .env file');
    console.log('');
  }
};

connectToMongoDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/meeting-links', meetingLinkRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webinar', webinar);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'
  });
});

// Demo data endpoint for testing
app.get('/api/demo', (req, res) => {
  res.json({
    message: 'Demo endpoint working!',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Demo endpoint: http://localhost:${PORT}/api/demo`);
}); 
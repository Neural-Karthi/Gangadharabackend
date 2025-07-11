import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define User schema (same as in server/models/User.js)
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin'
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

async function removeOldAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aura-elite');
    console.log('Connected to MongoDB');

    // Find and remove the old admin user
    const oldAdmin = await User.findOneAndDelete({ email: 'admin@example.com' });
    
    if (oldAdmin) {
      console.log('✅ Old admin user (admin@example.com) removed successfully');
    } else {
      console.log('ℹ️  No old admin user found to remove');
    }

    // Verify the new admin user exists
    const newAdmin = await User.findOne({ email: 'admin.gangadharnagarjuna@gmail.com' });
    if (newAdmin) {
      console.log('✅ New admin user (admin.gangadharnagarjuna@gmail.com) exists');
    } else {
      console.log('❌ New admin user not found! Please run: npm run create-admin');
    }

  } catch (error) {
    console.error('Error removing old admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

removeOldAdmin(); 
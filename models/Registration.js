import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone_number: {
    type: String,
    required: true,
    trim: true
  },
  profession: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    required: true,
    enum: ['live-workshops', 'premium-combo']
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  razorpay_payment_id: {
    type: String
  },
  razorpay_order_id: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
registrationSchema.index({ email: 1 });
registrationSchema.index({ status: 1 });
registrationSchema.index({ createdAt: -1 });

export default mongoose.model('Registration', registrationSchema); 
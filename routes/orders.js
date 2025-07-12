import express from 'express';
import Registration from '../models/Registration.js';
import { adminAuth } from '../middleware/auth.js';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';

const router = express.Router();

// Create order (replaces Supabase create-order function)
router.post('/create', async (req, res) => {
  try {
    const { name, email, phone_number, course, profession,priceamount } = req.body;
    if (!name || !email || !phone_number || !course) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Course details mapping
    const courseDetails = {
      'live-workshops': { price: priceamount, name: 'Sunday Live Workshops' },
      'premium-combo': { price: 24999, name: 'Premium Combo Course' },
    };

    const selectedCourse = courseDetails[course] || { price: 299, name: 'Business Foundation Course' };
    const amount = selectedCourse.price * 100; // Convert to paisa for Razorpay

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      // Return demo data if MongoDB is not connected
      const demoRegistrationId = `demo_${Date.now()}`;
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return res.json({
        success: true,
        data: {
          orderId,
          registrationId: demoRegistrationId,
          razorpayKeyId: 'rzp_live_Q9bJNJ9FrECD1v',
          amount,
          courseName: selectedCourse.name
        },
        message: 'Demo mode - MongoDB not connected'
      });
    }

    // Create registration in MongoDB
    const registration = new Registration({
      name,
      email,
      phone_number,
      profession,
      course,
      amount,
      status: 'pending'
    });

    await registration.save();

    // Initialize Razorpay instance
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    // Check if Razorpay credentials are available
if (!razorpayKeyId || !razorpayKeySecret) {
  return res.json({
    success: false,
    error: 'Razorpay credentials not configured. Check your .env file.'
  });
}



    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    // Create Razorpay order
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amount,
        currency: 'INR',
        receipt: `receipt_${registration._id}`,
        notes: {
          registration_id: registration._id.toString(),
          course: course,
          customer_name: name,
          customer_email: email
        }
      });
    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', razorpayError);
      
      // If Razorpay fails, return demo mode
      return res.json({
        success: true,
        data: {
          orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          registrationId: registration._id,
          razorpayKeyId: 'rzp_live_Q9bJNJ9FrECD1v',
          amount,
          courseName: selectedCourse.name
        },
        message: 'Demo mode - Razorpay order creation failed'
      });
    }

    res.json({
      success: true,
      data: {
        orderId: razorpayOrder.id, // Use actual Razorpay order ID
        registrationId: registration._id,
        razorpayKeyId,
        amount,
        courseName: selectedCourse.name
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all orders (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        data: [],
        message: 'Demo mode - MongoDB not connected'
      });
    }

    const registrations = await Registration.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router; 
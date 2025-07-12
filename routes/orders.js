import express from 'express';
import Registration from '../models/Registration.js';
import { adminAuth } from '../middleware/auth.js';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';

const router = express.Router();

// Create order
router.post('/create', async (req, res) => {
  try {
    const { name, email, phone_number, course, profession, priceamount } = req.body;
    if (!name || !email || !phone_number || !course) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    const courseDetails = {
      'live-workshops': { price: priceamount, name: 'Sunday Live Workshops' },
      'premium-combo': { price: 24999, name: 'Premium Combo Course' },
    };

    const selectedCourse = courseDetails[course] || { price: 299, name: 'Business Foundation Course' };
    const amount = selectedCourse.price * 100;

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

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(500).json({
        success: false,
        error: 'Razorpay credentials not configured. Check your .env file.'
      });
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `receipt_${registration._id}`,
      notes: {
        registration_id: registration._id.toString(),
        course,
        customer_name: name,
        customer_email: email
      }
    });

    res.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
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
    const registrations = await Registration.find().sort({ createdAt: -1 }).lean();

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

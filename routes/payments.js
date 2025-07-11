import express from 'express';
import crypto from 'crypto';
import Registration from '../models/Registration.js';
import { sendConfirmationEmail } from '../utils/email.js';

const router = express.Router();

// Verify payment (replaces Supabase verify-payment function)
router.post('/verify', async (req, res) => {
  try {
    const { order_id, payment_id, signature, registration_id, course_id } = req.body;

    if (!order_id || !payment_id || !signature || !registration_id || !course_id) {
      return res.status(400).json({
        success: false,
        error: 'All payment verification fields are required'
      });
    }

    // Verify Razorpay signature
    const body = order_id + "|" + payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isValidSignature = expectedSignature === signature;

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Update registration status
    const registration = await Registration.findByIdAndUpdate(
      registration_id,
      {
        status: 'completed',
        razorpay_payment_id: payment_id,
        razorpay_order_id: order_id
      },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    // Course details for email
    const courseDetails = {
      'live-workshops': { price: 299, name: 'Sunday Live Workshops' },
      'premium-combo': { price: 24999, name: 'Premium Combo Course' },
    };

    const selectedCourse = courseDetails[course_id] || { price: 299, name: 'Business Foundation Course' };

    // Send confirmation email
    try {
      await sendConfirmationEmail({
        email: registration.email,
        name: registration.name,
        courseName: selectedCourse.name,
        coursePrice: selectedCourse.price,
        registrationId: registration._id,
        courseId: course_id
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the payment verification if email fails
    }

    res.json({
      success: true,
      data: {
        verified: true,
        registration
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router; 
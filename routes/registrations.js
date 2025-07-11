import express from 'express';
import Registration from '../models/Registration.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all registrations with pagination
router.get('/', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [registrations, total] = await Promise.all([
      Registration.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Registration.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        data: registrations,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get registration count
router.get('/count', adminAuth, async (req, res) => {
  try {
    const count = await Registration.countDocuments();
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get count error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get registration by ID
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    res.json({
      success: true,
      data: registration
    });
  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new registration
router.post('/', async (req, res) => {
  try {
    const { name, email, phone_number, course, amount, profession } = req.body;

    if (!name || !email || !phone_number || !course || !amount) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    const registration = new Registration({
      name,
      email,
      phone_number,
      profession,
      course,
      amount
    });

    await registration.save();

    res.status(201).json({
      success: true,
      data: registration
    });
  } catch (error) {
    console.error('Create registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update registration
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    res.json({
      success: true,
      data: registration
    });
  } catch (error) {
    console.error('Update registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete registration
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const registration = await Registration.findByIdAndDelete(req.params.id);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    res.json({
      success: true,
      message: 'Registration deleted successfully'
    });
  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Clear all registrations
router.delete('/', adminAuth, async (req, res) => {
  try {
    await Registration.deleteMany({});
    
    res.json({
      success: true,
      message: 'All registrations cleared successfully'
    });
  } catch (error) {
    console.error('Clear registrations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router; 
import express from 'express';
import mongoose from 'mongoose';
import Webinar from '../models/Webinar.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Add new webinar
router.post('/add', adminAuth, async (req, res) => {
  try {
    const { date, startTime, endTime, mrp, Specialprice } = req.body;

    if (!date || !startTime || !endTime || !mrp) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const currentDateTime = new Date();
    const webinarEndTime = new Date(`${date}T${endTime}`);

    let isFeatured = false;

    if (webinarEndTime > currentDateTime) {
      // If this is a future webinar, unset featured from others
      await Webinar.updateMany(
        {
          $expr: {
            $gt: [
              { $dateFromString: { dateString: { $concat: ['$date', 'T', '$endTime'] } } },
              currentDateTime
            ]
          },
          isFeatured: true
        },
        { $set: { isFeatured: false } }
      );

      isFeatured = true;
    }

    const webinar = new Webinar({ date, startTime, endTime, mrp, Specialprice, isFeatured });
    await webinar.save();

    res.json({ success: true, data: webinar });
  } catch (error) {
    console.error('Add webinar error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get all webinars
router.get('/', adminAuth, async (req, res) => {
  try {
    const webinars = await Webinar.find().sort({ date: 1, startTime: 1 });
    res.json({ success: true, data: webinars });
  } catch (error) {
    console.error('Fetch webinars error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Set one completed webinar as featured
router.post('/set-featured/:id', adminAuth, async (req, res) => {
  try {
    const webinarId = req.params.id;

    const currentDateTime = new Date();

    const targetWebinar = await Webinar.findById(webinarId);
    if (!targetWebinar) return res.status(404).json({ success: false, error: 'Webinar not found' });

    const endDateTime = new Date(`${targetWebinar.date}T${targetWebinar.endTime}`);
    if (endDateTime > currentDateTime) {
      return res.status(400).json({ success: false, error: 'Only completed webinars can be featured' });
    }

    // Set isFeatured false for all completed webinars
    await Webinar.updateMany(
      {
        $expr: {
          $lt: [
            { $dateFromString: { dateString: { $concat: ['$date', 'T', '$endTime'] } } },
            currentDateTime
          ]
        },
        isFeatured: true
      },
      { $set: { isFeatured: false } }
    );

    // Set the target one as featured
    targetWebinar.isFeatured = true;
    await targetWebinar.save();

    res.json({ success: true, message: 'Featured webinar updated', data: targetWebinar });
  } catch (error) {
    console.error('Set featured error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

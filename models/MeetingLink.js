import mongoose from 'mongoose';

const meetingLinkSchema = new mongoose.Schema({
  course: {
    type: String,
    required: true,
    enum: ['live-workshops', 'premium-combo']
  },
  link: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
meetingLinkSchema.index({ course: 1, isActive: 1 });
meetingLinkSchema.index({ createdAt: -1 });

export default mongoose.model('MeetingLink', meetingLinkSchema); 
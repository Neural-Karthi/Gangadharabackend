import mongoose from 'mongoose';

const webinarSchema = new mongoose.Schema({
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  mrp: { type: Number, required: true },
  Specialprice: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

const Webinar = mongoose.model('Webinar', webinarSchema);

export default Webinar;

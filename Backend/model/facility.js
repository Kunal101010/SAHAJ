// models/facility.js
const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Facility name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Description is optional
        const wordCount = v.trim().split(/\s+/).filter(word => word.length > 0).length;
        return wordCount <= 200;
      },
      message: 'Description cannot exceed 200 words'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Facility = mongoose.model('Facility', facilitySchema);

module.exports = Facility;
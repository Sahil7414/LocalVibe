const mongoose = require('mongoose');

const rsvpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required']
    },
    status: {
      type: String,
      enum: ['GOING', 'INTERESTED'],
      required: [true, 'RSVP status is required']
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring one active RSVP per user per event
rsvpSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('RSVP', rsvpSchema);

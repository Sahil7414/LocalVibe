const mongoose = require('mongoose');

const EVENT_CATEGORIES = [
  'Music',
  'Food & Drink',
  'Sports',
  'Arts & Culture',
  'Community',
  'Markets',
  'Workshops',
  'Entertainment',
  'Shopping',
  'Education',
  'Social',
  'Nightlife',
  'Other'
];

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      maxlength: [3000, 'Description cannot exceed 3000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: EVENT_CATEGORIES,
        message: '{VALUE} is not a valid category'
      }
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      // GeoJSON standard: [longitude, latitude]
      coordinates: {
        type: [Number],
        required: [true, 'Location coordinates [longitude, latitude] are required'],
        validate: {
          validator: function (coords) {
            if (!Array.isArray(coords) || coords.length !== 2) return false;
            const [lng, lat] = coords;
            return (
              typeof lng === 'number' &&
              typeof lat === 'number' &&
              lng >= -180 &&
              lng <= 180 &&
              lat >= -90 &&
              lat <= 90
            );
          },
          message: 'Coordinates must be [longitude (-180..180), latitude (-90..90)]'
        }
      },
      address: {
        type: String,
        required: [true, 'Address string is required'],
        trim: true
      },
      city: {
        type: String,
        trim: true,
        default: ''
      }
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0
    },
    image: {
      type: String,
      required: [true, 'Cover image is required to publish your event'],
      trim: true
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer reference is required']
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DRAFT', 'CANCELLED', 'SUSPENDED'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

// MongoDB 2dsphere index on location field for geospatial queries
eventSchema.index({ location: '2dsphere' });
eventSchema.index({ category: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ isFeatured: 1 });
eventSchema.index({ title: 'text', description: 'text', 'location.address': 'text' });

module.exports = {
  Event: mongoose.model('Event', eventSchema),
  EVENT_CATEGORIES
};

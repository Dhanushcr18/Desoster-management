import mongoose, { Document, Schema } from 'mongoose';

export interface IAlert extends Document {
  title: string;
  description: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  severity: 'low' | 'medium' | 'high';
  source: string;
  verified: boolean;
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(v: number[]) {
          return v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && // longitude
                 v[1] >= -90 && v[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates. Format: [longitude, latitude]'
      }
    }
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
    default: 'medium'
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Geospatial index for location-based queries
AlertSchema.index({ geometry: '2dsphere' });
AlertSchema.index({ severity: 1, createdAt: -1 });

export default mongoose.model<IAlert>('Alert', AlertSchema);

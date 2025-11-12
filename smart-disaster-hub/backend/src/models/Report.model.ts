import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  alertId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'safe' | 'help';
  note?: string;
  safeRadius?: number; // Safe radius in kilometers
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  locationDetails?: {
    address?: string;
    landmark?: string;
    affectedRoad?: string;
    alternateRoute?: string;
    extraDistance?: number; // km extra via alternate route
    estimatedTime?: number; // minutes via alternate route
    routeDescription?: string;
  };
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>({
  alertId: {
    type: Schema.Types.ObjectId,
    ref: 'Alert',
    required: [true, 'Alert ID is required']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  status: {
    type: String,
    enum: ['safe', 'help'],
    required: [true, 'Status is required']
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, 'Note cannot exceed 500 characters']
  },
  safeRadius: {
    type: Number,
    min: [0, 'Safe radius cannot be negative'],
    max: [1000, 'Safe radius cannot exceed 1000 km']
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      validate: {
        validator: function(v: number[]) {
          return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
        },
        message: 'Invalid coordinates'
      }
    }
  },
  locationDetails: {
    address: { type: String, trim: true },
    landmark: { type: String, trim: true },
    affectedRoad: { type: String, trim: true },
    alternateRoute: { type: String, trim: true },
    extraDistance: { type: Number, min: 0 },
    estimatedTime: { type: Number, min: 0 },
    routeDescription: { type: String, trim: true, maxlength: 1000 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
ReportSchema.index({ alertId: 1, userId: 1 }, { unique: true }); // One report per user per alert
ReportSchema.index({ alertId: 1, status: 1 });
ReportSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IReport>('Report', ReportSchema);

import mongoose from 'mongoose';
import { USER_ROLES } from '@saintrocky/shared';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    deletionRequestedAt: { type: Date, default: null },
    authVersion: { type: Number, required: true, default: 0 },
    role: {
      type: String,
      required: true,
      enum: USER_ROLES,
      default: USER_ROLES[0]
    }
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

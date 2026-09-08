import { Schema, model, Document } from 'mongoose';

export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export interface UserDocument extends Document {
  username: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isEmailVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  googleId?: string;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ['CUSTOMER', 'SELLER', 'ADMIN'], default: 'CUSTOMER', index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    avatar: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
    googleId: { type: String, index: true, sparse: true, unique: true },
    passwordResetTokenHash: { type: String, select: false, index: true, sparse: true },
    passwordResetExpiresAt: { type: Date, select: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const User = model<UserDocument>('User', userSchema);

import { Schema, model, Document, Types } from 'mongoose';

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  parentId?: Types.ObjectId;
  icon?: string;
  isActive: boolean;
  returnPolicy: {
    returnable: boolean;
    returnWindowDays: number;
  };
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
    icon: { type: String },
    isActive: { type: Boolean, default: true },
    returnPolicy: {
      returnable: { type: Boolean, default: false },
      returnWindowDays: { type: Number, default: 0 },
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

categorySchema.index({ parentId: 1 });

export const Category = model<CategoryDocument>('Category', categorySchema);

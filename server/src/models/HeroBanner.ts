import { Schema, model, Document, Types } from 'mongoose';

/**
 * Singleton document — the admin-editable home page hero (headline, CTA,
 * photo). There is always exactly one; the service layer creates it with
 * sensible defaults on first read if it doesn't exist yet.
 */
export interface HeroBannerDocument extends Document {
  eyebrow: string;
  headline: string;
  subtext: string;
  ctaText: string;
  ctaLink: string;
  image?: {
    url: string;
    publicId: string;
  };
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const heroBannerSchema = new Schema<HeroBannerDocument>(
  {
    eyebrow: { type: String, required: true },
    headline: { type: String, required: true },
    subtext: { type: String, required: true },
    ctaText: { type: String, required: true },
    ctaLink: { type: String, required: true },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const HeroBanner = model<HeroBannerDocument>('HeroBanner', heroBannerSchema);

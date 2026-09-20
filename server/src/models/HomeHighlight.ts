import { Schema, model, Document, Types } from 'mongoose';

/**
 * Singleton document — the admin-editable "value prop" tiles on the home
 * page (the small icon + one-line-label cards next to the live menu/item
 * counts). Same one-document-always-exists pattern as HeroBanner.
 */
export interface HomeHighlightDocument extends Document {
  items: { icon: string; label: string }[];
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const homeHighlightSchema = new Schema<HomeHighlightDocument>(
  {
    items: [
      {
        _id: false,
        icon: { type: String, required: true },
        label: { type: String, required: true },
      },
    ],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const HomeHighlight = model<HomeHighlightDocument>('HomeHighlight', homeHighlightSchema);

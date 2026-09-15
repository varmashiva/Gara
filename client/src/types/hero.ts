export type HeroBanner = {
  _id: string;
  eyebrow: string;
  headline: string;
  subtext: string;
  ctaText: string;
  ctaLink: string;
  image?: {
    url: string;
    publicId: string;
  };
  updatedAt: string;
};

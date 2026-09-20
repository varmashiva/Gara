export type HomeHighlightItem = {
  icon: string;
  label: string;
};

export type HomeHighlight = {
  _id: string;
  items: HomeHighlightItem[];
  updatedAt: string;
};

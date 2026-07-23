// src/pages/gallery/types/gallery.ts

export type GalleryEntityType = "variant" | "model" | "sub_variant";
export type GalleryMediaType = "image" | "video";
export type GalleryCategory =
  | "exterior" | "interior" | "top_view" | "side_view"
  | "front_view" | "rear_view" | "360" | "color" | "detail" | "other"
  | "review" | "promo" | "walkaround";

export interface GalleryItem {
  id: string;
  entity_type: GalleryEntityType;
  entity_id: string;
  media_type: GalleryMediaType;
  category: GalleryCategory;
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  order: number;
  is_primary: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const IMAGE_CATEGORIES: { value: GalleryCategory; label: string }[] = [
  { value: "exterior", label: "Exterior" },
  { value: "interior", label: "Interior" },
  { value: "front_view", label: "Front View" },
  { value: "rear_view", label: "Rear View" },
  { value: "side_view", label: "Side View" },
  { value: "top_view", label: "Top View" },
  { value: "360", label: "360°" },
  { value: "color", label: "Color" },
  { value: "detail", label: "Detail" },
  { value: "other", label: "Other" },
];

export const VIDEO_CATEGORIES: { value: GalleryCategory; label: string }[] = [
  { value: "review", label: "Review" },
  { value: "promo", label: "Promo" },
  { value: "walkaround", label: "Walkaround" },
  { value: "other", label: "Other" },
];

export const CATEGORY_COLORS: Record<string, string> = {
  exterior: "primary",
  interior: "info",
  front_view: "secondary",
  rear_view: "secondary",
  side_view: "secondary",
  top_view: "secondary",
  "360": "dark",
  color: "warning",
  detail: "success",
  review: "danger",
  promo: "warning",
  walkaround: "success",
  other: "light",
};

// src/pages/blogs/types/blog.ts
export interface BlogSection {
  heading: string;
  content: string;
  images: string[];
  order: number;
}

export interface BlogSEO {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}

export interface Blog {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_images: string[];
  categories: string[];
  tags: string[];
  sections: BlogSection[];
  seo: BlogSEO;
  status: "draft" | "published";
  featured: boolean;
  created_at?: string;
  updated_at?: string;
}
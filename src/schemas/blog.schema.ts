//src/schemas/blog.schema.ts
import mongoose, { Schema, model, Document } from 'mongoose';

export interface  BlogSection {
  heading?: string;
  content?: string;
  images?: string;
  order?: number;
}

export interface BlogDocument extends Document {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  author?: {
    name: string;
    profileImage?: string;
  };
  categories?: string[];
  tags?: string[];
  sections?: BlogSection[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  viewCount?: number;
  published?: boolean;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const BlogSectionSchema = new Schema<BlogSection>(
  {
    heading: { type: String },
    content: { type: String  },
    images: { type: String },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

export const BlogSchema = new Schema<BlogDocument>(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    excerpt: { type: String },
    coverImage: { type: String },
    author: {
      name: { type: String },
      profileImage: { type: String },
    },
    categories: [{ type: String, index: true }],
    tags: [{ type: String, index: true }],
    sections: [BlogSectionSchema],
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      keywords: [{ type: String }],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    featured: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// 🧠 Indexes for SEO & performance
BlogSchema.index({ title: 'text', 'seo.keywords': 'text', tags: 'text' });

// ✅ Hot reload support for Next.js / AdminJS dev environment
export const Blog =
  (mongoose.models.Blog as mongoose.Model<BlogDocument>) ||
  model<BlogDocument>('Blog', BlogSchema);

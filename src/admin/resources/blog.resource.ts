// src/admin/resources/blog.resource.ts
import { ResourceOptions, ActionRequest, After, ValidationError  } from 'adminjs';
import { Model } from 'mongoose';
import { BlogDocument } from '../../schemas/blog.schema.js';

const blogResource = (BlogModel: BlogDocument) => ({
  resource: BlogModel,
  options: {
    parent: {
      name: 'EVInfo CMS',
      icon: 'FileText',
    },
    properties: {
      _id: {
        isVisible: false,
      },
      title: {
        isTitle: true,
        isRequired: true,
        position: 1,
      },
      slug: {
        isRequired: true,
        position: 2,
      },
      excerpt: {
        type: 'textarea',
        position: 3,
      },
      coverImage: {
        type: 'string',
        components: {
          edit: 'CustomS3Upload',
        },
        position: 4,
      },
      // Nested author fields
      'author.name': {
        label: 'Author Name',
        position: 5,
      },
      'author.profileImage': {
        label: 'Author Image',
        position: 6,
      },
      categories: {
        type: 'array',
        position: 7,
      },
      tags: {
        type: 'array',
        position: 8,
      },
      // Blog sections - UPDATED with array components
      sections: {
        type: 'mixed',
        isArray: true,
        position: 9,
        components: {
          show: 'BlogSectionsShow',
          edit: 'BlogSectionsEdit',
          list: 'BlogSectionsList',
        },
      },
      // SEO section
      'seo.metaTitle': {
        label: 'SEO Title',
        position: 10,
      },
      'seo.metaDescription': {
        type: 'textarea',
        label: 'SEO Description',
        position: 11,
      },
      'seo.keywords': {
        type: 'array',
        label: 'SEO Keywords',
        position: 12,
      },
      // Status control
      status: {
        availableValues: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' },
        ],
        position: 13,
      },
      featured: {
        type: 'boolean',
        position: 14,
      },
      viewCount: {
        isVisible: { list: true, edit: false, show: true },
        position: 15,
      },
      publishedAt: {
        isVisible: { list: true, edit: false, show: true },
        position: 16,
      },
      createdAt: {
        isVisible: { list: true, show: true, edit: false },
        position: 17,
      },
      updatedAt: {
        isVisible: { list: true, show: true, edit: false },
        position: 18,
      },
    } as Record<string, any>,

    actions: {
      new: {
        before: async (request) => {
          const errors = {}
          if (!request.payload) return request;
          const payload = { ...request.payload };

          if (!payload.title || payload.title.length < 3) {
            errors['title'] = { message: 'Title is required and must be at least 3 characters long.' };
          }
          console.log('Before New Request Payload:', payload);

          const fixArrayFields = (prefix: string) => {
            const items = Object.keys(payload)
              .filter((key) => key.startsWith(`${prefix}.`))
              .map((key) => payload[key])
              .filter(Boolean);

            if (items.length > 0) payload[prefix] = items;
          };

          fixArrayFields('categories');
          fixArrayFields('tags');
          fixArrayFields('seo.keywords');

          if (payload.sections && typeof payload.sections === 'string') {
            try {
              payload.sections = JSON.parse(payload.sections);
            } catch (err) {
              console.warn('❌ Failed to parse sections JSON:', err);
              payload.sections = [];
            }
          }

          if (!payload.slug && payload.title) {
            payload.slug = payload.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)+/g, '');
          }

          if (payload.status === 'published') {
            payload.publishedAt = new Date();
          }

          if (Object.keys(errors).length) {
            throw new ValidationError(errors)
          }

          // ✅ Return modified request (this is correct for "before")
          return { ...request, payload };
        },

        after: async (response, request) => {
          console.log("✅ After New Action - Response:", response);
          // You can modify response.record if needed
          return response; // ✅ Must always return response, not request
        },
      },

      edit: {
        before: async (request) => {
          if (!request.payload) return request;
          const payload = { ...request.payload };

          console.log('Before Edit Request Payload:', payload);

          const fixArrayFields = (prefix: string) => {
            const items = Object.keys(payload)
              .filter((key) => key.startsWith(`${prefix}.`))
              .map((key) => payload[key])
              .filter(Boolean);

            if (items.length > 0) payload[prefix] = items;
          };

          fixArrayFields('categories');
          fixArrayFields('tags');
          fixArrayFields('seo.keywords');

          if (payload.sections && typeof payload.sections === 'string') {
            try {
              payload.sections = JSON.parse(payload.sections);
            } catch (err) {
              console.warn('❌ Failed to parse sections JSON:', err);
              payload.sections = [];
            }
          }

          if (!payload.slug && payload.title) {
            payload.slug = payload.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)+/g, '');
          }

          if (payload.status === 'published') {
            payload.publishedAt = new Date();
          }

          // ✅ Correct
          return { ...request, payload };
        },

        after: async (response, request) => {
          console.log("✅ After Edit Action - Response:", response);
          return response; // ✅ Always return response
        },
      },
    }
    ,

    listProperties: ['title', 'status', 'featured', 'viewCount', 'createdAt'],
    editProperties: [
      'title',
      'slug',
      'excerpt',
      'coverImage',
      'author.name',
      'author.profileImage',
      'categories',
      'tags',
      'sections',
      'seo.metaTitle',
      'seo.metaDescription',
      'seo.keywords',
      'status',
      'featured',
    ],
    showProperties: [
      'title',
      'slug',
      'excerpt',
      'coverImage',
      'author.name',
      'author.profileImage',
      'categories',
      'tags',
      'sections',
      'seo.metaTitle',
      'seo.metaDescription',
      'seo.keywords',
      'status',
      'featured',
      'viewCount',
      'publishedAt',
      'createdAt',
      'updatedAt',
    ],
    filterProperties: ['title', 'status', 'featured', 'categories', 'tags'],
    sort: { direction: 'desc', sortBy: 'createdAt' },
  } as ResourceOptions,
});

export default blogResource;
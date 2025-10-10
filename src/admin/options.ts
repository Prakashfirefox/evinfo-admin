// admin/admin.options.js
import AdminJS, { AdminJSOptions, BrandingOptions  } from 'adminjs';
import * as AdminJSMongoose from '@adminjs/mongoose';
import componentLoader from './component-loader.js';

import blogResource from './resources/blog.resource.js'; // 👈 import the blog config

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

export default function buildAdminOptions(models) {
  const { BlogModel } = models;

  const resources = [
    blogResource(BlogModel),
    // ✅ Add future models here, e.g.:
    // carResource(CarModel),
    // userResource(UserModel),
  ];

    const branding: BrandingOptions = {
    companyName: 'My Admin',
    logo: false, // ✅ allowed: string | false
  };

  const adminOptions = {
    componentLoader,
    rootPath: '/admin',
    resources,
    databases: [],
    branding,
    locale: {
      language: 'en',
      translations: {
        labels: {
          Blog: 'Blog Posts',
        },
      },
    },
  };

  return adminOptions;
}

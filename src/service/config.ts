//src/service/config.ts
const apiUrl = process.env.REACT_APP_BASE_URL || '';


//Media upload to bunny
export const MEDIA_PRESIGN_URL = `${apiUrl}/api/v1/admin/media/presign`;

//login admin panel prakash
export const adminlogin = `${apiUrl}/api/v1/admin/auth/login`;

// Forgot / Reset password (public — no JWT required)
export const FORGOT_PASSWORD_URL = `${apiUrl}/api/v1/public/auth/forgot-password`;
export const RESET_PASSWORD_URL  = `${apiUrl}/api/v1/public/auth/reset-password`;

export const BLOG_CREATE = `${apiUrl}/api/v1/admin/blogs/create-blog`;
export const BLOG_UPDATE = `${apiUrl}/api/v1/admin/blogs/:id/update-blog`;
export const BLOG_GET = `${apiUrl}/api/v1/admin/blogs/:id`;
export const BLOG_GET_ALL = `${apiUrl}/api/v1/admin/blogs/get-all-blogs`;
export const BLOG_DELETE = `${apiUrl}/api/v1/admin/blogs/:id`;
export const BLOG_UPDATE_STATUS = `${apiUrl}/api/v1/admin/blogs/:id/status`;


//Banner APIs
export const BANNER_CREATE = `${apiUrl}/api/v1/admin/banners/create-banner`;
export const BANNER_UPDATE = `${apiUrl}/api/v1/admin/banners/:id/update-banner`;
export const BANNER_GET = `${apiUrl}/api/v1/admin/banners/:id`;
export const BANNER_GET_ALL = `${apiUrl}/api/v1/admin/banners/get-all-banners`;
export const BANNER_DELETE = `${apiUrl}/api/v1/admin/banners/:id`;
export const BANNER_UPDATE_STATUS = `${apiUrl}/api/v1/admin/banners/:id/status`;



// Blog Link APIs
export const BLOG_LINK_ADD = `${apiUrl}/api/v1/admin/blog-links/add`;
export const BLOG_LINK_REMOVE = `${apiUrl}/api/v1/admin/blog-links/remove`;
export const BLOG_LINK_GET_BY_BLOG = `${apiUrl}/api/v1/admin/blog-links/blog/:blogId`;
export const BLOG_LINK_GET_BY_ENTITY = `${apiUrl}/api/v1/admin/blog-links/entity/:type/:entityId`;

// Stats APIs
export const STATS_DASHBOARD = `${apiUrl}/api/v1/admin/stats/dashboard`;
export const STATS_OVERVIEW = `${apiUrl}/api/v1/admin/stats/get-overview`;
export const STATS_BRANDS = `${apiUrl}/api/v1/admin/stats/get-brands-stats`;
export const STATS_POPULAR_VEHICLES = `${apiUrl}/api/v1/admin/stats/get-popular-variants`;

// Brand APIs
export const BRAND_CREATE = `${apiUrl}/api/v1/admin/brands/create-brand`;
export const BRAND_UPDATE = `${apiUrl}/api/v1/admin/brands/:id/update-brand`;
export const BRAND_GET = `${apiUrl}/api/v1/admin/brands/:id`;
export const BRAND_GET_ALL = `${apiUrl}/api/v1/admin/brands/get-all-brands`;
export const BRAND_DELETE = `${apiUrl}/api/v1/admin/brands/:id`;
export const BRAND_UPDATE_STATUS = `${apiUrl}/api/v1/admin/brands/:id/status`;

// Vehicle Model APIs
export const MODEL_CREATE = `${apiUrl}/api/v1/admin/models/create-model`;
export const MODEL_UPDATE = `${apiUrl}/api/v1/admin/models/:id/update-model`;
export const MODEL_GET = `${apiUrl}/api/v1/admin/models/:id`;
export const MODEL_GET_ALL = `${apiUrl}/api/v1/admin/models/get-all-models`;
export const MODEL_DELETE = `${apiUrl}/api/v1/admin/models/:id`;
export const MODEL_UPDATE_STATUS = `${apiUrl}/api/v1/admin/models/:id/status`;

// Variant APIs
export const VARIANT_CREATE = `${apiUrl}/api/v1/admin/variants/create-variant`;
export const VARIANT_UPDATE = `${apiUrl}/api/v1/admin/variants/:id/update-variant`;
export const VARIANT_GET = `${apiUrl}/api/v1/admin/variants/:id`;
export const VARIANT_GET_ALL = `${apiUrl}/api/v1/admin/variants/get-all-variants`;
export const VARIANT_DELETE = `${apiUrl}/api/v1/admin/variants/:id`;
export const VARIANT_UPDATE_STATUS = `${apiUrl}/api/v1/admin/variants/:id/status`;

// Vehicle APIs (backed by /sub-variants on the API side)
export const VEHICLE_CREATE = `${apiUrl}/api/v1/admin/sub-variants/create`;
export const VEHICLE_UPDATE = `${apiUrl}/api/v1/admin/sub-variants/:id/update`;
export const VEHICLE_GET = `${apiUrl}/api/v1/admin/sub-variants/:id`;
export const VEHICLE_GET_ALL = `${apiUrl}/api/v1/admin/sub-variants/get-all`;
export const VEHICLE_DELETE = `${apiUrl}/api/v1/admin/sub-variants/:id`;
export const VEHICLE_UPDATE_STATUS = `${apiUrl}/api/v1/admin/sub-variants/:id/status`;

// Specifications APIs
export const SPEC_UPSERT = `${apiUrl}/api/v1/admin/specifications/upsert`;
export const SPEC_UPDATE = `${apiUrl}/api/v1/admin/specifications/:id/update`;

// Pricing APIs
export const PRICING_CREATE = `${apiUrl}/api/v1/admin/pricing/create`;
export const PRICING_UPDATE = `${apiUrl}/api/v1/admin/pricing/:id/update`;

// Review APIs
export const REVIEW_CREATE = `${apiUrl}/api/v1/admin/reviews/create-review`;
export const REVIEW_GET_ALL = `${apiUrl}/api/v1/admin/reviews/get-all-reviews`;
export const REVIEW_DELETE = `${apiUrl}/api/v1/admin/reviews/:id`;
export const REVIEW_UPDATE_STATUS = `${apiUrl}/api/v1/admin/reviews/:id/status`;

// Gallery APIs
export const GALLERY_ADD = `${apiUrl}/api/v1/admin/gallery/add`;
export const GALLERY_GET = `${apiUrl}/api/v1/admin/gallery/:entityType/:entityId`;
export const GALLERY_UPDATE = `${apiUrl}/api/v1/admin/gallery/:id`;
export const GALLERY_DELETE = `${apiUrl}/api/v1/admin/gallery/:id`;
export const GALLERY_REORDER = `${apiUrl}/api/v1/admin/gallery/reorder`;

// Contact enquiries APIs
export const CONTACT_GET_ALL = `${apiUrl}/api/v1/admin/contact/get-all`;
export const CONTACT_UPDATE_STATUS = `${apiUrl}/api/v1/admin/contact/:id/status`;
export const CONTACT_DELETE = `${apiUrl}/api/v1/admin/contact/:id`;

// Dealer APIs
export const DEALER_CREATE = `${apiUrl}/api/v1/admin/dealers/create-dealer`;
export const DEALER_UPDATE = `${apiUrl}/api/v1/admin/dealers/:id/update-dealer`;
export const DEALER_GET = `${apiUrl}/api/v1/admin/dealers/:id`;
export const DEALER_GET_ALL = `${apiUrl}/api/v1/admin/dealers/get-all-dealers`;
export const DEALER_DELETE = `${apiUrl}/api/v1/admin/dealers/:id`;
export const DEALER_UPDATE_STATUS = `${apiUrl}/api/v1/admin/dealers/:id/status`;

export const adminlogout = `${apiUrl}/api/v1/clear-align/admin/auth/logout`;
export const getAllUsers = `${apiUrl}/api/v1/clear-align/admin/user/get-all-Users`;
export const getLeadCounts = `${apiUrl}/api/v1/clear-align/admin/user/status-counts`;
export const updateLeadStatusURL = (leadId: number) =>   `${apiUrl}/api/v1/clear-align/admin/user/${leadId}/status`;
export const sendInviteEmailURL = (leadId: number) =>  `${apiUrl}/api/v1/clear-align/admin/user/${leadId}/invite`;

//Organization APIs
export const getOrganizationsURL = `${apiUrl}/api/v1/clear-align/admin/organizations`;
export const getOrganizationDetailsURL = (orgId: number) =>  `${apiUrl}/api/v1/clear-align/admin/organization/${orgId}`;
export const assignOrganizationFrameworkURL = (orgId: number) => `${apiUrl}/api/v1/clear-align/admin/organization/${orgId}/assign-frameworks`;

//Framework APIs
export const getFrameworksListURL = `${apiUrl}/api/v1/clear-align/admin/frameworks`;



export const azureLogin = `${apiUrl}/api/v1/auth`;
export const signOut = `${apiUrl}/auth/signout`;
export const createTraining = `${apiUrl}/api/v1/training`;
export const Training = `${apiUrl}/api/v1/training`;
export const fetchDepartments = `${apiUrl}/api/v1/training`;
export const fetchTrainingListByDateRange = `${apiUrl}/api/v1/training`;
export const groupSync = `${apiUrl}/api/v1/training/groups-sync`;

export const fetchUsersDetails = `${apiUrl}/api/v1/auth`;
export const syncAzureUserApi = `${apiUrl}/api/v1`;
export const generateInviteCode = `${apiUrl}/api/v1/auth`;

export const assessmentUrl = `${apiUrl}/api/v1/assessment`;
export const assessmentQuestnUrl = `${apiUrl}/api/v1/assessment-questn`;

export const dashboardUrl = `${apiUrl}/api/v1/dashboard`;

export const teamUrl = `${apiUrl}/api/v1/team`;

export const moduleUrl = `${apiUrl}/api/v1/modules`;

export const rolesUrl = `${apiUrl}/api/v1/roles`;
export const rbacUrl = `${apiUrl}/api/v1/rbac`;
export const authUrl = `${apiUrl}/api/v1/auth`;



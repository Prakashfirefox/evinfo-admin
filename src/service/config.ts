//src/service/config.ts
const apiUrl = process.env.REACT_APP_BASE_URL || '';


//Media upload to bunny
export const MEDIA_PRESIGN_URL = `${apiUrl}/api/v1/media/presign`;

//login admin panel prakash
export const adminlogin = `${apiUrl}/api/v1/auth/login`;

export const BLOG_CREATE = `${apiUrl}/api/v1/blogs/create-blog`;
export const BLOG_UPDATE = `${apiUrl}/api/v1/blogs/:id/update-blog`;
export const BLOG_GET = `${apiUrl}/api/v1/blogs/:id`;
export const BLOG_GET_ALL = `${apiUrl}/api/v1/blogs/get-all-blogs`;
export const BLOG_DELETE = `${apiUrl}/api/v1/blogs/:id`;
export const BLOG_UPDATE_STATUS = `${apiUrl}/api/v1/blogs/:id/status`;


//Banner APIs
export const BANNER_CREATE = `${apiUrl}/api/v1/banners/create-banner`;
export const BANNER_UPDATE = `${apiUrl}/api/v1/banners/:id/update-banner`;
export const BANNER_GET = `${apiUrl}/api/v1/banners/:id`;
export const BANNER_GET_ALL = `${apiUrl}/api/v1/banners/get-all-banners`;
export const BANNER_DELETE = `${apiUrl}/api/v1/banners/:id`;
export const BANNER_UPDATE_STATUS = `${apiUrl}/api/v1/banners/:id/status`;



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



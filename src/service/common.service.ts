//src/service/common.service.ts
import { toast } from "react-toastify";
import { MODULES, SCREEN_PATH, USER_ROLES } from "../constants";
import axiosInstance from "./axios.service";
import {
  azureLogin,
  signOut,
  generateInviteCode,
  syncAzureUserApi,
  fetchUsersDetails,
  groupSync,
  Training,
  createTraining,
  fetchDepartments,
  fetchTrainingListByDateRange,
  assessmentUrl,
  assessmentQuestnUrl,
  teamUrl,
  dashboardUrl,
  moduleUrl,
  rolesUrl,
  rbacUrl,
  authUrl,
} from "./config";
import {
  adminlogin,
  adminlogout,
  getAllUsers,
  getLeadCounts,
  updateLeadStatusURL,
  sendInviteEmailURL,
  getOrganizationsURL,
  getOrganizationDetailsURL,
  assignOrganizationFrameworkURL,
  getFrameworksListURL
} from "./config";
import { FORGOT_PASSWORD_URL, RESET_PASSWORD_URL } from "./config";
import {
  BLOG_CREATE,
  BLOG_UPDATE,
  BLOG_GET,
  BLOG_GET_ALL,
  BLOG_DELETE,
  BLOG_UPDATE_STATUS
} from "./config";
import{ BANNER_CREATE, BANNER_UPDATE, BANNER_GET, BANNER_GET_ALL, BANNER_DELETE, BANNER_UPDATE_STATUS } from "./config";
import {
  BLOG_LINK_ADD, BLOG_LINK_REMOVE, BLOG_LINK_GET_BY_BLOG, BLOG_LINK_GET_BY_ENTITY,
  STATS_DASHBOARD, STATS_OVERVIEW, STATS_BRANDS, STATS_POPULAR_VEHICLES,
  BRAND_CREATE, BRAND_UPDATE, BRAND_GET, BRAND_GET_ALL, BRAND_DELETE, BRAND_UPDATE_STATUS,
  MODEL_CREATE, MODEL_UPDATE, MODEL_GET, MODEL_GET_ALL, MODEL_DELETE, MODEL_UPDATE_STATUS,
  VARIANT_CREATE, VARIANT_UPDATE, VARIANT_GET, VARIANT_GET_ALL, VARIANT_DELETE, VARIANT_UPDATE_STATUS,
  VEHICLE_CREATE, VEHICLE_UPDATE, VEHICLE_GET, VEHICLE_GET_ALL, VEHICLE_DELETE, VEHICLE_UPDATE_STATUS,
  REVIEW_GET_ALL, REVIEW_DELETE, REVIEW_UPDATE_STATUS,
  DEALER_CREATE, DEALER_UPDATE, DEALER_GET, DEALER_GET_ALL, DEALER_DELETE, DEALER_UPDATE_STATUS,
  GALLERY_ADD, GALLERY_GET, GALLERY_UPDATE, GALLERY_DELETE, GALLERY_REORDER,
  SPEC_UPSERT, SPEC_UPDATE,
  CONTACT_GET_ALL, CONTACT_UPDATE_STATUS, CONTACT_DELETE,
  PRICING_CREATE, PRICING_UPDATE,
} from "./config";
import { io } from "socket.io-client";
import { ModulePermissionResult } from "./types";

// const headersToken = process.env.REACT_APP_OPEN_TOKEN;
const headersToken = "$2b$10$I/l4Vr5fikIpNvaF6NbgXeJr1pB3B6cwgZMIFdM9Ot2mefrrv6o4u"


// Extract a human-readable error string from the API's response body.
// The backend uses several shapes:
//   Responser.error → { status: false, message: "...", data?: {...} }
//   validateRequest (Joi) → { error: "Field X must be ..." }
//   ValidationErrorHandler → { status: false, message: "...", data: [{ parameter, message }, ...] }
// We try them in order and return the first useful string we find.
const extractApiErrorMessage = (responseBody: any): string | null => {
  if (!responseBody || typeof responseBody !== "object") return null;

  // Shape: Joi { error: "..." }
  if (typeof responseBody.error === "string" && responseBody.error.trim()) {
    return responseBody.error;
  }

  // Shape: { message: "..." } from Responser.error
  if (typeof responseBody.message === "string" && responseBody.message.trim()) {
    // If `data` carries richer field-level info, prefer that
    const fieldMsg = extractFieldError(responseBody.data);
    return fieldMsg || responseBody.message;
  }

  // Shape: bare { errors: [...] }
  if (Array.isArray(responseBody.errors)) {
    const first = responseBody.errors[0];
    if (typeof first === "string") return first;
    if (first && typeof first.message === "string") return first.message;
  }

  return null;
};

// Field-level extractor — handles the array-of-{parameter,message} form
// from class-validator AND the object form { fieldName: "msg" } from Joi.
const extractFieldError = (data: any): string | null => {
  if (!data) return null;

  // Array form: [{ parameter: "name", message: "..." }, ...]
  if (Array.isArray(data)) {
    const first = data[0];
    if (first && typeof first.message === "string") {
      return first.parameter
        ? `${first.parameter}: ${first.message}`
        : first.message;
    }
    if (typeof first === "string") return first;
    return null;
  }

  // Object form: { fieldName: "error message" }
  if (typeof data === "object") {
    for (const value of Object.values(data)) {
      if (typeof value === "string" && value.trim()) return value;
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
  }

  return null;
};

// Centralized error toaster — uses the API's actual error text whenever possible
// so callers don't have to guess. Pages can still toast their own success messages.
const handleErrorToast = (error: any) => {
  const statusCode = error?.response?.status;
  const responseBody = error?.response?.data;
  const apiMessage = extractApiErrorMessage(responseBody);

  // No HTTP response at all → network/timeout
  if (!error?.response) {
    if (error?.code === "ECONNABORTED") {
      toast.error("Request timed out. Please try again.");
    } else {
      toast.error("Network error. Please check your connection.");
    }
    return;
  }

  switch (statusCode) {
    case 401:
      toast.error(apiMessage || "Session expired. Please log in again.");
      break;
    case 403:
      toast.error(apiMessage || "You do not have permission for this action.");
      break;
    case 404:
      toast.error(apiMessage || "Resource not found.");
      break;
    case 409:
      toast.error(apiMessage || "Conflict — this resource already exists.");
      break;
    case 400:
    case 422:
      toast.error(apiMessage || "Validation failed.");
      break;
    case 429:
      toast.error(apiMessage || "Too many requests. Please slow down.");
      break;
    default:
      if (statusCode >= 500) {
        toast.error(apiMessage || "Server error. Please try again later.");
      } else {
        toast.error(apiMessage || `Request failed (${statusCode})`);
      }
  }
};

const apiRequest = async (
  url: string,
  method: "get" | "post" | "put" | "delete" | "patch",
  data?: any,
  requestToken?: string
) => {
  try {
    let authToken: any = await getInitialUserData();
    if (
      !authToken &&
      !url.includes(`${adminlogin}`) &&
      !url.includes(`${azureLogin}/azure-login`) &&
      !url.includes(`${signOut}`)
    ) {
      toast.error("You are not signed in. Please log in.");
      return null;
    }

    let headers = url.includes(`${adminlogin}`)
      ? { token: headersToken }
      : {
        authorization: `Bearer ${authToken?.access_token || ""}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

    const res = await axiosInstance({
      url,
      method,
      data,
      headers,
      timeout: 120000,
      withCredentials: false,
    });

    // Any 2xx is success
    if (res.status >= 200 && res.status < 300) {
      return res;
    }

    // Defensive — axios usually throws on non-2xx, but handle gracefully if not
    toast.error(res.data?.message || `Unexpected response (${res.status})`);
    return res;
  } catch (error: any) {
    handleErrorToast(error);

    if (error?.response?.status === 401) {
      // Delay so the toast is visible before redirect
      setTimeout(() => { window.location.href = "/"; }, 1200);
    }

    return error?.response ?? null;
  }
};

export const getInitialUserData = (): any => {
  const stored = localStorage.getItem("userData") || localStorage.getItem("decodedToken");
  try {
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Failed to parse user data:", error);
    return null;
  }
};

//Admin  api integration New  
export const login = async (data: any) => {
  return await apiRequest(`${adminlogin}`, "post", data);
};

// Public requests — no auth token required (user is not logged in)
const publicRequest = async (url: string, data: any) => {
  try {
    const res = await axiosInstance({
      url,
      method: "post",
      data,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      timeout: 30000,
    });
    return res;
  } catch (error: any) {
    handleErrorToast(error);
    return error?.response ?? null;
  }
};

export const forgotPassword = (email: string) =>
  publicRequest(FORGOT_PASSWORD_URL, { email });

export const resetPassword = (token: string, email: string, new_password: string) =>
  publicRequest(RESET_PASSWORD_URL, { token, email, new_password });


/* ================================
   MEDIA UPLOAD – COMMON SERVICE
================================ */

export const uploadMediaFile = async (
  file: File,
  folder: string
): Promise<string> => {
  try {
    // 1️⃣ Get presigned upload details
    const presignRes = await apiRequest(
      "/api/v1/admin/media/presign",
      "post",
      {
        fileName: file.name,
        folder,
      }
    );
    console.log('presignRes>>',presignRes)
    if (!presignRes?.data?.status) {
      throw new Error("Failed to get upload URL");
    }

    const { uploadUrl, headers, publicUrl } = presignRes.data.data;

    // 2️⃣ Upload directly to Bunny (NO AUTH HEADERS)
   const responseUpload =  await fetch(uploadUrl, {
      method: "PUT",
      headers,
      body: file,
    });
    console.log('responseUpload>>',responseUpload)

    // 3️⃣ Return CDN URL
    return publicUrl;
  } catch (error: any) {
    console.error("Media upload failed", error);
    throw error;
  }
};

/* ================================
   BLOGS – ADMIN SERVICES
================================ */

// Get all blogs (list + pagination + search)
export const getAllBlogs = (payload: {
  search?: string;
  offset?: number;
  limit?: number;
}) => {
  return apiRequest(
    BLOG_GET_ALL,
    "post",
    payload
  );
};

// Get single blog by ID
export const getBlogById = (id: string) => {
  return apiRequest(
    BLOG_GET.replace(":id", id),
    "get"
  );
};

// Create new blog
export const createBlog = (payload: any) => {
  return apiRequest(
    BLOG_CREATE,
    "post",
    payload
  );
};

// Update blog
export const updateBlog = (id: string, payload: any) => {
  return apiRequest(
    BLOG_UPDATE.replace(":id", id),
    "put",
    payload
  );
};

// Delete blog
export const deleteBlog = (id: string) => {
  return apiRequest(
    BLOG_DELETE.replace(":id", id),
    "delete"
  );
};

// Update blog status (published / draft)
export const updateBlogStatus = (
  id: string,
  status: "published" | "draft"
) => {
  return apiRequest(
    BLOG_UPDATE_STATUS.replace(":id", id),
    "patch",
    { status }
  );
};

export const createBanner= async (data: any) => { 
  return await apiRequest(`${BANNER_CREATE}`, "post", data);
};

export const updateBanner= async (id: string, data: any) => {
  return await apiRequest(`${BANNER_UPDATE.replace(":id", id)}`, "put", data);
};
export const getBannerById= async (id: string) => {
  return await apiRequest(`${BANNER_GET.replace(":id", id)}`, "get");
};
export const getAllBanners= async (data: any) => {
  return await apiRequest(`${BANNER_GET_ALL}`, "post", data);
};
export const deleteBanner= async (id: string) => {
  return await apiRequest(`${BANNER_DELETE.replace(":id", id)}`, "delete");
};
export const updateBannerStatus= async (id: string, status: 'active' | 'inactive' | 'scheduled' | 'expired') => {
  return await apiRequest(`${BANNER_UPDATE_STATUS.replace(":id", id)}`, "patch", { status });
};

/* ================================
   GALLERY – ADMIN SERVICES
================================ */
export const addGalleryItem = async (payload: {
  entity_type: string; entity_id: string; media_type: string;
  category: string; url: string; thumbnail?: string;
  title?: string; description?: string; order?: number; is_primary?: boolean;
}) => apiRequest(GALLERY_ADD, "post", payload);

export const getGalleryItems = async (entityType: string, entityId: string, params?: { media_type?: string; category?: string }) => {
  const url = GALLERY_GET.replace(":entityType", entityType).replace(":entityId", entityId);
  const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
  return apiRequest(`${url}${query}`, "get");
};

export const updateGalleryItem = async (id: string, payload: { category?: string; title?: string; description?: string; order?: number; is_primary?: boolean }) =>
  apiRequest(GALLERY_UPDATE.replace(":id", id), "patch", payload);

export const deleteGalleryItem = async (id: string) =>
  apiRequest(GALLERY_DELETE.replace(":id", id), "delete");

export const reorderGalleryItems = async (items: { id: string; order: number }[]) =>
  apiRequest(GALLERY_REORDER, "post", { items });

/* ================================
   BLOG LINKS – ADMIN SERVICES
================================ */
export const addBlogLink = async (blog_id: string, linked_type: string, linked_id: string) =>
  apiRequest(BLOG_LINK_ADD, "post", { blog_id, linked_type, linked_id });

export const removeBlogLink = async (blog_id: string, linked_type: string, linked_id: string) =>
  apiRequest(BLOG_LINK_REMOVE, "post", { blog_id, linked_type, linked_id });

export const getBlogLinks = async (blogId: string, linked_type?: string) => {
  const url = BLOG_LINK_GET_BY_BLOG.replace(":blogId", blogId);
  return apiRequest(linked_type ? `${url}?linked_type=${linked_type}` : url, "get");
};

export const getLinkedBlogs = async (type: string, entityId: string, offset = 0, limit = 10) =>
  apiRequest(
    BLOG_LINK_GET_BY_ENTITY.replace(":type", type).replace(":entityId", entityId) + `?offset=${offset}&limit=${limit}`,
    "get"
  );

/* ================================
   STATS – ADMIN SERVICES
================================ */
export const getDashboardStats = async () =>
  apiRequest(STATS_DASHBOARD, "get");
export const getOverviewStats = async (params?: any) =>
  apiRequest(`${STATS_OVERVIEW}${params ? '?' + new URLSearchParams(params).toString() : ''}`, "get");
export const getBrandsStats = async (params?: any) =>
  apiRequest(`${STATS_BRANDS}${params ? '?' + new URLSearchParams(params).toString() : ''}`, "get");
export const getPopularVehiclesStats = async (params?: any) =>
  apiRequest(`${STATS_POPULAR_VEHICLES}${params ? '?' + new URLSearchParams(params).toString() : ''}`, "get");

/* ================================
   BRANDS – ADMIN SERVICES
================================ */
export const getAllBrands = async (data: any) =>
  apiRequest(BRAND_GET_ALL, "post", data);
export const getBrandById = async (id: string) =>
  apiRequest(BRAND_GET.replace(":id", id), "get");
export const createBrand = async (data: any) =>
  apiRequest(BRAND_CREATE, "post", data);
export const updateBrand = async (id: string, data: any) =>
  apiRequest(BRAND_UPDATE.replace(":id", id), "put", data);
export const deleteBrand = async (id: string) =>
  apiRequest(BRAND_DELETE.replace(":id", id), "delete");
export const updateBrandStatus = async (id: string, status: string) =>
  apiRequest(BRAND_UPDATE_STATUS.replace(":id", id), "patch", { status });

/* ================================
   VEHICLE MODELS – ADMIN SERVICES
================================ */
export const getAllModels = async (data: any) =>
  apiRequest(MODEL_GET_ALL, "post", data);
export const getModelById = async (id: string) =>
  apiRequest(MODEL_GET.replace(":id", id), "get");
export const createModel = async (data: any) =>
  apiRequest(MODEL_CREATE, "post", data);
export const updateModel = async (id: string, data: any) =>
  apiRequest(MODEL_UPDATE.replace(":id", id), "put", data);
export const deleteModel = async (id: string) =>
  apiRequest(MODEL_DELETE.replace(":id", id), "delete");
export const updateModelStatus = async (id: string, status: string) =>
  apiRequest(MODEL_UPDATE_STATUS.replace(":id", id), "patch", { status });

/* ================================
   VARIANTS – ADMIN SERVICES
================================ */
export const getAllVariants = async (data: any) =>
  apiRequest(VARIANT_GET_ALL, "post", data);
export const getVariantById = async (id: string) =>
  apiRequest(VARIANT_GET.replace(":id", id), "get");
export const createVariant = async (data: any) =>
  apiRequest(VARIANT_CREATE, "post", data);
export const updateVariant = async (id: string, data: any) =>
  apiRequest(VARIANT_UPDATE.replace(":id", id), "put", data);
export const deleteVariant = async (id: string) =>
  apiRequest(VARIANT_DELETE.replace(":id", id), "delete");
export const updateVariantStatus = async (id: string, status: string) =>
  apiRequest(VARIANT_UPDATE_STATUS.replace(":id", id), "patch", { status });

/* ================================
   VEHICLES – ADMIN SERVICES
================================ */
export const getAllVehicles = async (data: any) =>
  apiRequest(VEHICLE_GET_ALL, "post", data);
export const getVehicleById = async (id: string) =>
  apiRequest(VEHICLE_GET.replace(":id", id), "get");
export const createVehicle = async (data: any) =>
  apiRequest(VEHICLE_CREATE, "post", data);
export const updateVehicle = async (id: string, data: any) =>
  apiRequest(VEHICLE_UPDATE.replace(":id", id), "put", data);
export const deleteVehicle = async (id: string) =>
  apiRequest(VEHICLE_DELETE.replace(":id", id), "delete");
export const updateVehicleStatus = async (id: string, status: string) =>
  apiRequest(VEHICLE_UPDATE_STATUS.replace(":id", id), "patch", { status });

/* ================================
   SPECIFICATIONS – ADMIN SERVICES
================================ */
export const getContactMessages = async (params?: any) => {
  const q = new URLSearchParams(params || {}).toString();
  return apiRequest(`${CONTACT_GET_ALL}${q ? `?${q}` : ""}`, "get");
};
export const updateContactStatus = async (id: string, status: string) =>
  apiRequest(CONTACT_UPDATE_STATUS.replace(":id", id), "patch", { status });
export const deleteContactMessage = async (id: string) =>
  apiRequest(CONTACT_DELETE.replace(":id", id), "delete");

export const upsertSpecifications = async (data: any) =>
  apiRequest(SPEC_UPSERT, "post", data);
export const updateSpecifications = async (id: string, data: any) =>
  apiRequest(SPEC_UPDATE.replace(":id", id), "put", data);

/* ================================
   PRICING – ADMIN SERVICES
================================ */
export const createPricing = async (data: any) =>
  apiRequest(PRICING_CREATE, "post", data);
export const updatePricing = async (id: string, data: any) =>
  apiRequest(PRICING_UPDATE.replace(":id", id), "put", data);

/* ================================
   REVIEWS – ADMIN SERVICES
================================ */
export const getAllReviews = async (data: any) =>
  apiRequest(REVIEW_GET_ALL, "post", data);
export const deleteReview = async (id: string) =>
  apiRequest(REVIEW_DELETE.replace(":id", id), "delete");
export const updateReviewStatus = async (id: string, status: string) =>
  apiRequest(REVIEW_UPDATE_STATUS.replace(":id", id), "patch", { status });

/* ================================
   DEALERS – ADMIN SERVICES
================================ */
export const getAllDealers = async (data: any) =>
  apiRequest(DEALER_GET_ALL, "post", data);
export const getDealerById = async (id: string) =>
  apiRequest(DEALER_GET.replace(":id", id), "get");
export const createDealer = async (data: any) =>
  apiRequest(DEALER_CREATE, "post", data);
export const updateDealer = async (id: string, data: any) =>
  apiRequest(DEALER_UPDATE.replace(":id", id), "put", data);
export const deleteDealer = async (id: string) =>
  apiRequest(DEALER_DELETE.replace(":id", id), "delete");
export const updateDealerStatus = async (id: string, status: string) =>
  apiRequest(DEALER_UPDATE_STATUS.replace(":id", id), "patch", { status });






export const logout = async() =>{
    return await apiRequest(`${adminlogout}`, "post");
}

export const getAllLeads = async(data: any) => {
      return await apiRequest(`${getAllUsers}`, "post", data);
}

export const getAllLeadsCounts = async() => {
      return await apiRequest(`${getLeadCounts}`, "get");
}

export const updateLeadStatus = async (leadId: number, data: { status: string }) => {
  const url = updateLeadStatusURL(leadId);
  return await apiRequest(url, "patch", data);
};

export const sendInviteEmail = async (leadId: number, data: { email: string }) => {
  const url = sendInviteEmailURL(leadId);
  return await apiRequest(url, "post", data);
};


export const getOrganizations = async (data: any) => {
  return await apiRequest(`${getOrganizationsURL}`, "post", data);
};

export const getOrganizationDetails = async (orgId: number) => {
  const url = `${getOrganizationDetailsURL(orgId)}`;
  return await apiRequest(url, "get");
};

export const assignOrganizationFramework = async (orgId: number, data: any) => {
  const url = `${assignOrganizationFrameworkURL(orgId)}`;
  return await apiRequest(url, "put", data);
};  

export const getFrameworksList = async (data: any) => {
  return await apiRequest(`${getFrameworksListURL}`, "post", data );
};









// old code ------------------------------------------------------------------

export const azureUserLogin = async (data: any) => {
  return await apiRequest(`${azureLogin}/azure-login`, "post", data);
};

export const signoutApi = async () => {
  return await apiRequest(`${signOut}`, "get", null);
};

export const createTrainingApi = async (data: any) => {
  return await apiRequest(`${createTraining}/create-training`, "post", data);
};

export const fetchDepartment = async () => {
  return await apiRequest(`${fetchDepartments}/fetch-department`, "get");
};

export const fetchDepartmentUserManagement = async () => {
  return await apiRequest(
    `${fetchDepartments}/fetch-department-user-management`,
    "get"
  );
};

export const fetchLocation = async () => {
  return await apiRequest(`${Training}/locations`, "get");
};

export const fetchLocationByDivIdApi = async (data: any) => {
  return await apiRequest(`${Training}/get-locations-by-divId`, "post", data);
};







export const requestNewInviteCode = async (data: any) => {
  return await apiRequest(
    `${generateInviteCode}/request-new-invite-code`,
    "post",
    data
  );
};

export const downloadUsers = async (data: any) => {
  return await apiRequest(`${fetchUsersDetails}/users-export`, "post", data);
};

export const fetchTrainingsListByDateRange = async (data: any) => {
  return await apiRequest(
    `${fetchTrainingListByDateRange}/list-by-date-range`,
    "post",
    data
  );
};

export const groupSyncApi = async (data: any) => {
  return await apiRequest(`${groupSync}`, "post", data);
};

export const updateTraining = async (data: any) => {
  return await apiRequest(`${Training}/update`, "post", data);
};

export const cancelTrainingApi = async (data: any) => {
  return await apiRequest(`${Training}/cancel`, "post", data);
};

export const getTrainingByTeamId = async (data: any) => {
  return await apiRequest(`${Training}/get-training-by-teamId`, "post", data);
};
export const getAssessmentByTeamId = async (data: any) => {
  return await apiRequest(
    `${assessmentUrl}/get-assessment-byteam`,
    "post",
    data
  );
};

export const generateReports = async (data: any) => {
  return await apiRequest(`${Training}/generate-report-training`, "post", data);
};

export const generateAssReports = async (data: any) => {
  return await apiRequest(`${assessmentUrl}/export`, "post", data);
};

export const fetchUsersDetailApi = async (data: any) => {
  return await apiRequest(
    `${fetchUsersDetails}/fetch-user-details`,
    "post",
    data
  );
};

export const fetchUsersDetailByStnIdApi = async (data: any) => {
  return await apiRequest(
    `${fetchUsersDetails}/fetch-users-by-stationId`,
    "post",
    data
  );
};


export const syncAzureData = async (data: any) => {
  return await apiRequest(`${syncAzureUserApi}/import-users`, "post", "");
};

export const getFormattedCurrentTime = () => {
  const currentTime = new Date();
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

  return formattedTime;
};

export const addRecord = async (
  data: any,
  path: string = "",
  method: any = "post"
) => {
  return await apiRequest(`${assessmentUrl}/create-record`, method, data);
};

export const getTrainingListByDpId = async (
  data: any,
  path: string = "",
  method: any = "post"
) => {
  return await apiRequest(
    `${Training}/get-training-list-by-dpId`,
    method,
    data
  );
};
export const getDaysTrainingListByDpId = async (
  data: any,
  path: string = "",
  method: any = "post"
) => {
  return await apiRequest(
    `${Training}/get-upcoming-current-days-tl`,
    method,
    data
  );
};

export const closeTrainingSessionApi = async (
  data: any,
  path: string = "",
  method: any = "post"
) => {
  return await apiRequest(`${Training}/close-training-session`, method, data);
};

export const getTrainingRunningStatusApi = async (
  data: any,
  path: string = "",
  method: any = "post"
) => {
  return await apiRequest(
    `${Training}/get-training-running-status`,
    method,
    data
  );
};
export const getHeartRateZoneList = async (
  data: any,
  path: string = "",
  method: any = "post"
) => {
  return await apiRequest(`${Training}/get-heart-rate-zone-list`, method, data);
};

export const getHeartRateZoneListLive = async (
  data: any,
  path: string = "",
  method: any = "post"
) => {
  return await apiRequest(`${Training}/get-heart-rate-zone-list-live`, method, data);
};


export const getLiveTrainingDataList = async (
  data: any,
  path: string = "",
  method: any = "post"
) => {
  return await apiRequest(`${Training}/get-live-training-data`, method, data);
};

export const getLiveTrainingDataListLive = async (
  data: any,
  path: string = "",
  method: any = "post"
) => {
  return await apiRequest(`${Training}/get-live-training-data-live`, method, data);
};


export const getLiveTrainingLocation = async (
  data: any,
  path: string = "",
  method: any = "post"
) => {
  return await apiRequest(`${Training}/get-training-location`, method, data);
};


export const fetchAssessments = async (data: any) => {
  return await apiRequest(`${assessmentUrl}/get-assessmnt-list`, "post", data);
};

export const deleteAssessment = async (data: any) => {
  return await apiRequest(`${assessmentUrl}/delete-record`, "post", data);
};

export const getAssessmentRecord = async (data: any) => {
  return await apiRequest(`${assessmentUrl}/get-record`, "post", data);
};
export const updateAssessmentRecord = async (
  data: any,
  path: string = "",
  method: any = "post"
) => {
  return await apiRequest(`${assessmentUrl}/update-record`, method, data);
};

export const addquestionnaire = async (
  data: any,
  path: string = "",
  method: any = "post"
) => {
  return await apiRequest(`${assessmentQuestnUrl}/create-record`, method, data);
};

export const fetchquestionnaire = async (data: any) => {
  return await apiRequest(
    `${assessmentQuestnUrl}/get-record-list-by-aId`,
    "post",
    data
  );
};

export const deleteQuestionnaire = async (data: any) => {
  return await apiRequest(`${assessmentQuestnUrl}/delete-record`, "post", data);
};

export const getQuestionnaire = async (data: any) => {
  return await apiRequest(`${assessmentQuestnUrl}/get-record`, "post", data);
};

export const updateQuestionnaire = async (data: any) => {
  return await apiRequest(`${assessmentQuestnUrl}/update-record`, "post", data);
};

export const assessmentResult = async (data: any) => {
  return await apiRequest(
    `${assessmentUrl}/get-assessment-results`,
    "post",
    data
  );
};

export const getAssmntCpListUsers = async (data: any) => {
  return await apiRequest(
    `${assessmentUrl}/get-assessmnt-cp-list-users`,
    "post",
    data
  );
};

export const getTeamList = async (data: any) => {
  return await apiRequest(`${teamUrl}/get-team-list`, "post", data);
};

export const deleteTeam = async (data: any) => {
  return await apiRequest(`${teamUrl}/delete-team`, "post", data);
};

export const createTeam = async (data: any) => {
  return await apiRequest(`${teamUrl}/create-team`, "post", data);
};

export const getTeamRecordApi = async (data: any) => {
  return await apiRequest(`${teamUrl}/fetch-team`, "post", data);
};

export const updateTeamApi = async (data: any) => {
  return await apiRequest(`${teamUrl}/update-team`, "post", data);
};

// export const getUserToken = async () => {
//   const userData = localStorage.getItem("userData");
//   // console.log('userData>>',userData)
//   if (userData) {
//     const token = JSON.parse(userData);
//     // console.log('userData token>>',token)
//     if (token) return token;
//   }
// };

export const fetchTeams = async (data: any) => {
  return await apiRequest(`${Training}/get-training-by-teamId`, "post", data);
};

export const updateTimerListApi = async (data: any) => {
  return await apiRequest(`${Training}/update-timer-list`, "post", data);
};

export const migrateDataApi = async (data: any) => {
  return await apiRequest(`${Training}/migrate-data`, "post", data);
};

export const getUtcTime = (date: any = null) => {
  const now = new Date();
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

export const formatDateToYYMMDD = (date: any = null) => {
  const d = date == null ? new Date() : new Date(date);
  const year = String(d.getFullYear());
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};


export const getRbacPermissionData = async (moduleType: MODULES) => {
  let element: any = null
  let resonseData: any = await getInitialUserData()// await getUserToken()
  const rbacPermsnData: any = resonseData?.userStationRecord?.rbacData ?? []
  // console.log('rbacPermsnData>>',rbacPermsnData)
  if (rbacPermsnData.length > 0) {
    element = rbacPermsnData.find((item: any) => item?.module_name.trim() == moduleType)
    // console.log('element>>',rbacPermsnData,element)

  }

  return element
}

export const fetchDashboard = async (data: any) => {
  return await apiRequest(`${dashboardUrl}/details`, "post", data);
};


export const initializeSocket = (userData: any) => {
  let socket: any = null;
  if (!userData || !userData.userId) {
    console.error("User data is not available or invalid.");
    return null
  }
  else {
    socket = io(process.env.REACT_APP_BASE_URL || '', {
      path: "",
      query: { userIDAdmin: userData.userId.toString() }
    })
    return socket
  }
}

export const verifyRbac = (moduleName: string) => {
  const userData: any = JSON.parse(
    localStorage.getItem("userData") ||
    "{}"
  );

  let accessStatus: boolean = false
  //console.log('verifyRbac from>>',userData,userData?.userStationRecord.rbacData,userData?.userStationRecord.accessList)
  if (userData?.userStationRecord?.accessList.length > 0 && userData?.userStationRecord?.accessList.includes(moduleName)) {
    accessStatus = true
  }
  return accessStatus
}

export const getModulePermission = async (): Promise<ModulePermissionResult> => {

  let accessStatus = false
  let errMsg: string = ''
  let moduleUrl: string = ''

  const userData: any = JSON.parse(
    localStorage.getItem("userData") ||
    "{}"
  );

  const modulesList: string[] = userData?.userStationRecord?.accessList ?? []
  if (!modulesList.includes(MODULES.LOGIN)) {
    errMsg = 'Sorry, You do not have necessary permissions to access this application'
  }
  else if (modulesList.length > 0) {
    // accessStatus=false
    const leftModules: any = modulesList.filter((record: any) => (record != MODULES.LOGIN && record != MODULES.WMS_MOBILE && record != MODULES.WMS_WERABLE))
    //  console.log('leftModules>>',leftModules)
    if (leftModules.length > 0) {
      accessStatus = true

      if (modulesList.includes(MODULES.DASHBOARD)) {
        moduleUrl = SCREEN_PATH.DASHBOARD
      }
      else if (modulesList.includes(MODULES.USER_MANAGEMENT)) {
        moduleUrl = SCREEN_PATH.USER_MANAGEMENT
      }
      else if (modulesList.includes(MODULES.MANAGE_TEAMS)) {
        moduleUrl = SCREEN_PATH.MANAGE_TEAMS
      }
      else if (!modulesList.includes(MODULES.DASHBOARD)) {
        const element = leftModules[0]
        moduleUrl = getModuleUrl(element)
      }
      // else {
      //   const element = leftModules.find((item: any) => item == MODULES.DASHBOARD)
      //   console.log('element2>>',element)
      //   moduleUrl = getModuleUrl(element)
      // }
    }
    else {
      errMsg = 'Don’t have permission to access all the Modules'
    }


  }
  return { accessStatus, errMsg, moduleUrl }

  // console.log('getModulePermission from>>',modulesList,accessStatus,errMsg,moduleUrl,userData?.userStationRecord.rbacData,userData?.userStationRecord.accessList)
}


export const getModuleUrl = (module: string): string => {
  const moduleMap: Record<string, string> = {
    [MODULES.DASHBOARD]: SCREEN_PATH.DASHBOARD,
    [MODULES.ASSESSMENTS]: SCREEN_PATH.ASSESSMENTS,
    [MODULES.MANAGE_TEAMS]: SCREEN_PATH.MANAGE_TEAMS,
    [MODULES.MANAGE_TRAININGS]: SCREEN_PATH.MANAGE_TRAININGS,
    [MODULES.LIVE_DATA]: SCREEN_PATH.LIVE_DATA,
    [MODULES.LIVE_VIEW]: SCREEN_PATH.LIVE_VIEW,
    [MODULES.COMPLETED_TRAININGS]: SCREEN_PATH.COMPLETED_TRAININGS,
    [MODULES.REPORTS]: SCREEN_PATH.REPORTS,
    [MODULES.USER_MANAGEMENT]: SCREEN_PATH.USER_MANAGEMENT,
    [MODULES.ROLES]: SCREEN_PATH.RBAC
  };

  return moduleMap[module] || '';
};

export const getModulesListApi = async (data: any) => {
  return await apiRequest(`${moduleUrl}/get-modules-list`, "post", data);
};

export const getRolesListApi = async (data: any) => {
  return await apiRequest(`${rolesUrl}/get-roles-list`, "post", data);
};

export const addRole = async (data: any) => {
  return await apiRequest(`${rbacUrl}/create-record`, "post", data);
};

export const getRoleRecordApi = async (data: any) => {
  return await apiRequest(`${rbacUrl}/get-record`, "post", data);
};

export const updateRoleApi = async (data: any) => {
  return await apiRequest(`${rbacUrl}/update-record`, "post", data);
};

export const deleteRoleApi = async (data: any) => {
  return await apiRequest(`${rbacUrl}/remove-rbac`, "post", data);
};

export const checkOngoingTrainingAPi = async () => {
  return await apiRequest(`${Training}/check-ongoing-training`, "post");
}





export const getTeamListByStnIdApi = async (payload: any) => {
  return await apiRequest(`${teamUrl}/get-team-list-by-stationId`, "post", payload);
}


export const addSecondaryListApi = async (payload: any) => {
  return await apiRequest(`${authUrl}/add-secondary-role`, "post", payload);
}


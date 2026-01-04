//src/service/common.service.ts
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
import {
  BLOG_CREATE,
  BLOG_UPDATE,
  BLOG_GET,
  BLOG_GET_ALL,
  BLOG_DELETE,
  BLOG_UPDATE_STATUS
} from "./config";
import{ BANNER_CREATE, BANNER_UPDATE, BANNER_GET, BANNER_GET_ALL, BANNER_DELETE, BANNER_UPDATE_STATUS } from "./config";
import { io } from "socket.io-client";
import { ModulePermissionResult } from "./types";

// const headersToken = process.env.REACT_APP_OPEN_TOKEN;
const headersToken = "$2b$10$I/l4Vr5fikIpNvaF6NbgXeJr1pB3B6cwgZMIFdM9Ot2mefrrv6o4u"


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
      console.error("No authentication token found.");
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

    if (res.status === 200 || res.status === 201) {
      return res;
    }
    console.error("Unexpected response status:", res.status);
    return null;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.warn("Token expired or forbidden. Redirecting to auth page...");
      window.location.href = "/";
    }
    console.log(error)
    return error.response;
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
      "/api/v1/media/presign",
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
export const getBlogById = (id: number) => {
  return apiRequest(
    BLOG_GET.replace(":id", String(id)),
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
export const updateBlog = (id: number, payload: any) => {
  return apiRequest(
    BLOG_UPDATE.replace(":id", String(id)),
    "put",
    payload
  );
};

// Delete blog
export const deleteBlog = (id: number) => {
  return apiRequest(
    BLOG_DELETE.replace(":id", String(id)),
    "delete"
  );
};

// Update blog status (published / draft)
export const updateBlogStatus = (
  id: number,
  status: "published" | "draft"
) => {
  return apiRequest(
    BLOG_UPDATE_STATUS.replace(":id", String(id)),
    "patch",
    { status }
  );
};

export const createBanner= async (data: any) => { 
  return await apiRequest(`${BANNER_CREATE}`, "post", data);
};

export const updateBanner= async (id: number, data: any) => { 
  return await apiRequest(`${BANNER_UPDATE.replace(":id", String(id))}`, "put", data);
};
export const getBannerById= async (id: number) => { 
  return await apiRequest(`${BANNER_GET.replace(":id", String(id))}`, "get"); 
};
export const getAllBanners= async (data: any) => {
  return await apiRequest(`${BANNER_GET_ALL}`, "post", data);
};
export const deleteBanner= async (id: number) => {
  return await apiRequest(`${BANNER_DELETE.replace(":id", String(id))}`, "delete");
};
export const updateBannerStatus= async (id: number, status: 'active' | 'inactive' | 'scheduled' | 'expired') => {
  return await apiRequest(`${BANNER_UPDATE_STATUS.replace(":id", String(id))}`, "patch", { status });
};






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


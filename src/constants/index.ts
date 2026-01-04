export enum MODULES {
    LOGIN = "Login",
    WMS_MOBILE = "WMS Mobile",
    WMS_WERABLE = "WMS Wearable",
    DASHBOARD = "Dashboard",
    MANAGE_TRAININGS = "Manage Trainings",
    MANAGE_TEAMS = "Manage Teams",
    LIVE_DATA = "Live Data",
    LIVE_VIEW = "Live View",
    COMPLETED_TRAININGS = "Completed Trainings",
    ASSESSMENTS = "Assessments",
    REPORTS = "Reports",
    USER_MANAGEMENT = "User Management",
    ROLES = "ROLES",
}

export const MODULES_INCLUDE_OPERATION = [
    "Manage Trainings",
    "Manage Teams",
    "Assessments"
]



export enum CRUD_OPERATION {
    CREATE = "c",
    READ = "r",
    UPDATE = "u",
    DELETE = "d",
}


export enum USER_ROLES {
   

}

export const CHECK_STATION_DROPDOWN = [
  
]

export enum SCREEN_PATH {
    DASHBOARD = "/dashboard",
    MANAGE_TRAININGS = "/manage-trainings-events",
    MANAGE_TEAMS = "/manage-teams",
    LIVE_DATA = "/live-training-and-tracking",
    LIVE_VIEW = "/live-training-view",
    COMPLETED_TRAININGS = "/completed-training-and-tracking",
    ASSESSMENTS = "/assessments",
    REPORTS = "/reports",
    USER_MANAGEMENT = "/user-management",
    RBAC = "/roles",
}


export const SENIOR_MANAGEMNT = [
  
]


export const ALL_ADMINS = [
   
]
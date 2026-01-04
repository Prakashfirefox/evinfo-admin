import { MODULES, USER_ROLES } from "../constants";

// export const getModulesByRole =  (roleName: any,moduleList:any) => {
//     switch(roleName){
//         case USER_ROLES.SUPER_ADMIN:
//             return []
//         case USER_ROLES.COMMANDER:
//                 return moduleList
//         case USER_ROLES.DIVISION_COMMANDER:{
//             let dcList=[MODULES.LOGIN,MODULES.DASHBOARD,MODULES.COMPLETED_TRAININGS,MODULES.REPORTS,MODULES.ASSESSMENTS]
//             // let revisedList=moduleList.filter((record:any)=>dcList.includes(record.name))   
//             // Step 1: Create a map for faster lookup

//             const objectMap = new Map(moduleList.map((obj:any) => [obj.name, obj]));

//             // Step 2: Filter and reorder
//             const revisedList = dcList
//             .filter((name:any) => name !== MODULES.ASSESSMENTS && objectMap.has(name))
//             .map((name:any) => objectMap.get(name));

//             // Step 3: Append "Assessments" if it exists
//             if (objectMap.has(MODULES.ASSESSMENTS)) {
//                 revisedList.push(objectMap.get('Assessments'));
//             }

//             // console.log(revisedList);
//             // console.log(dcList)
//             // console.log(revisedList,moduleList)
//             return revisedList
//         }
          
//         case USER_ROLES.COMMISSIONER:
//         case USER_ROLES.DIRECTOR_OPS:
//         case USER_ROLES.DY_COMMISSIONER:{
//             return []
//         }
               
//         default:
//             return []
//     }
// };



export const getSecondaryRoleName=(roleList:any)=>{
    
    let roleName= ''

    return roleName
}
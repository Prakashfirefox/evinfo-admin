import { lazy } from "react";
import { retry } from "../utils/index";
import { HiHome } from "react-icons/hi";

const adminRoutes = [
  
  {
    name: "ForgotPasscode",
    initialName: "/ForgotPasscode",
    path: "/ForgotPasscode",
    component: lazy((): any =>
      retry(() => import("../pages/officer/auth/forgotpasscode/index"))
    ),
    menu: true,
    icon: HiHome,
  },
];

export default adminRoutes;

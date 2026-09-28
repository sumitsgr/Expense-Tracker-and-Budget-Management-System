import { configureAuth } from "react-query-auth";
import { Navigate, useLocation } from "react-router";
import { z } from "zod";

import { paths } from "@/config/paths";
import { AuthResponse, User } from "@/types/api";

import { api } from "./api-client";

// api call definitions for auth (types, schemas, requests):
// these are not part of features as this is a module shared across features

// const getUser = async (): Promise<User> => {
//   const response = await api.get("/api/auth/me");
//   // console.log(response);
//   return response.data;
// };

const getUser = async () => {
  const user = localStorage.getItem("user");
  if (!user) return null;
  return JSON.parse(user);
};

// const logout = (): Promise<void> => {
//   return api.post("/api/auth/logout");
// };
const logout = async (): Promise<void> => {
  await api.post("/auth/logout");
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  // queryClient.removeQueries(); // or queryClient.clear()
  queryClient.clear();
};

export const loginInputSchema = z.object({
  email: z.string().min(1, "Required").email("Invalid email"),
  password: z.string().min(5, "Required"),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
const loginWithEmailAndPassword = (data: LoginInput): Promise<AuthResponse> => {
  return api.post("/auth/login", data);
};

export const registerInputSchema = z.object({
  email: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
  // lastName: z.string().min(1, "Required"),
  password: z.string().min(5, "Required"),
});
// .and(
//   z
//     .object({
//       teamId: z.string().min(1, "Required"),
//       teamName: z.null().default(null),
//     })
//     .or(
//       z.object({
//         teamName: z.string().min(1, "Required"),
//         teamId: z.null().default(null),
//       }),
//     ),
// );

export type RegisterInput = z.infer<typeof registerInputSchema>;

const registerWithEmailAndPassword = (
  data: RegisterInput,
): Promise<AuthResponse> => {
  return api.post("/auth/register", data);
};

const authConfig = {
  userFn: getUser,
  loginFn: async (data: LoginInput) => {
    const response = await loginWithEmailAndPassword(data);

    const { user, accessToken } = response.data;
    // console.log(response.data.accessToken);

    localStorage.setItem("authToken", accessToken);
    localStorage.setItem("user", JSON.stringify(user));

    return user;
  },
  registerFn: async (data: RegisterInput) => {
    const response = await registerWithEmailAndPassword(data);
    return response.user;
  },
  logoutFn: logout,
};

export const { useUser, useLogin, useLogout, useRegister, AuthLoader } =
  configureAuth(authConfig);

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useUser();
  const location = useLocation();
  // console.log(user);

  if (!user.data) {
    return (
      <Navigate to={paths.auth.login.getHref(location.pathname)} replace />
    );
  }

  return children;
};

import axiosInstance from "../lib/axios";

export const userApi = {
  getMe: async () => {
    const response = await axiosInstance.get("/users/me");
    return response.data;
  },

  updateRole: async (role) => {
    const response = await axiosInstance.patch("/users/role", { role });
    return response.data;
  },
};
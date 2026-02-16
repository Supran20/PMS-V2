import api from "../axios";

interface LoginData {
  email: string;
  password: string;
}

export const login = async (data: LoginData) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export const verifyOTP = async (otp: string) => {
  const temp_token = localStorage.getItem("temp_token");
  if (!temp_token) throw new Error("Session expired. Please login again.");

  const res = await api.post(
    "/auth/verify-otp",
    { otp },
    {
      headers: {
        Authorization: `Bearer ${temp_token}`,
      },
    },
  );
  return res.data;
};

export const resendOTP = async () => {
  const temp_token = localStorage.getItem("temp_token");
  if (!temp_token) throw new Error("Session expired. Please login again.");

  const res = await api.get("/auth/resend-otp", {
    headers: { Authorization: `Bearer ${temp_token}` },
  });
  return res.data;
};

export const getProfile = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("temp_token");
  localStorage.removeItem("loginEmail");
  window.location.href = "/";
};

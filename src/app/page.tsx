"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Image from "next/image";
import { login } from "@/lib/api/auth";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";

/* ================= VALIDATION SCHEMA ================= */
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  /* ================= SUBMIT HANDLER ================= */
  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);

    try {
      console.log("Sending login request", data);
      const res = await login(data);
      console.log("Login response", res);

      if (res.temp_token) {
        localStorage.setItem("temp_token", res.temp_token);
        localStorage.setItem("loginEmail", data.email);
        router.push("/verify-otp");
      }

      if (res.accessToken && res.refreshToken) {
        localStorage.setItem("accessToken", res.accessToken);
        localStorage.setItem("refreshToken", res.refreshToken);

        await refreshUser();

        router.push("/dashboard");
        toast.success("Login successful");

        return;
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.error || "Invalid credentials");
      } else {
        toast.error("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="flex items-center justify-center py-16">
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <Card className="w-full max-w-md border border-gray-400 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <Image src="/rst.png" alt="RST Logo" width={120} height={40} />
              </div>
              <p className="text-gray-600 text-md font-medium">
                Please sign in to access the dashboard
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50  text-gray-900 "
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className="w-full px-4 py-3 pr-11 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50  text-gray-900"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? (
                        <Icon icon="ion:eye" className="text-lg" />
                      ) : (
                        <Icon icon="ion:eye-off" className="text-lg" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full py-3 text-white bg-blue-800 hover:bg-blue-900 transition-all rounded-md"
                >
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


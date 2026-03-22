"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Image from "next/image";
import { verifyOTP, resendOTP, logout } from "@/lib/api/auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { otpSchema, OTPFormValues } from "@/lib/validations/auth.validation";

/* ================= VALIDATION ================= */
// const otpSchema = z.object({
//   otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
//   rememberMe: z.boolean().optional(),
// });

// type OTPFormValues = z.infer<typeof otpSchema>;

const OTPPage = () => {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  /* ================= GET EMAIL ================= */
  useEffect(() => {
    const storedEmail = localStorage.getItem("loginEmail");
    if (!storedEmail) {
      toast.error("Session expired. Please login again.");
      router.push("/");
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  /* ================= OTP INPUT HANDLER ================= */

  /* ================= SUBMIT ================= */
  const onSubmit = async (data: OTPFormValues) => {
    setLoading(true);
    const otpCode = data.otp;

    try {
      const res = await verifyOTP(otpCode, data.rememberMe);

      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);

      localStorage.removeItem("temp_token");
      localStorage.removeItem("loginEmail");

      // toast.success("OTP verified successfully");
      await refreshUser();
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Invalid or expired OTP");
      } else {
        toast.error("OTP verification failed");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESEND OTP ================= */
  const handleResend = async () => {
    try {
      setLoading(true);
      await resendOTP();
      setLoading(false);
      toast.success("A new OTP has been sent to your email");
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Failed to resend OTP");
      } else {
        toast.error("Failed to resend OTP");
      }
    }
  };

  /* ================= MASK EMAIL ================= */
  const maskEmail = (email: string) => {
    const [name, domain] = email.split("@");
    if (!name || name.length <= 3) return email;
    return `${name.slice(0, 2)}*****${name.slice(-1)}@${domain}`;
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
    <div className="min-h-screen bg-bg-primary w-full flex items-center justify-center md:inline-block">
      <div className="flex items-center justify-center sm:py-16 px-4">
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <Card className="w-full max-w-md border border-primary-border shadow-lg p-6  px-4 sm:px-0">
            <CardHeader className="text-center">
              <Image
                src="/rst.png"
                alt="Logo"
                width={120}
                height={40}
                className="mx-auto"
              />
              <p className="mt-4 text-gray-600">Enter the 6-digit OTP</p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div className="flex justify-center flex-col ">
                  <input
                    type="text"
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="Enter OTP"
                    {...register("otp")}
                    className="w-full text-center border rounded-md text-lg h-12"
                  />
                  {errors.otp?.message && (
                    <p className="text-red-600 text-sm start mt-1">
                      {errors.otp.message}
                    </p>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex gap-1.5">
                      <input type="checkbox" {...register("rememberMe")} />
                      <span>Remember me</span>
                    </div>
                    <Button
                      type="button"
                      className="text-sm font-medium italic underline text-gray-600 border-0 flex items-center justify-end mt-1.5 "
                      onClick={handleResend}
                    >
                      Resend OTP
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-800 hover:bg-blue-900 text-white"
                >
                  Verify OTP
                </Button>

                {/* <Button
                  type="button"
                  className="w-full bg-blue-800 hover:bg-blue-900 text-white"
                  onClick={handleResend}
                >
                  Resend OTP
                </Button> */}

                <Button
                  type="button"
                  className="w-full border border-primary-color text-blue-600 rounded"
                  onClick={logout}
                >
                  Go back
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OTPPage;

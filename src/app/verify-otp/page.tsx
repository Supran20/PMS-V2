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

/* ================= VALIDATION ================= */
const otpSchema = z.object({
  otp: z
    .array(z.string().regex(/^\d$/, "Must be a digit"))
    .length(6, "Enter 6-digit OTP"),
});

type OTPFormValues = z.infer<typeof otpSchema>;

const OTPPage = () => {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: Array(6).fill(""),
    },
  });

  const otp = watch("otp");

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
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setValue("otp", newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    } else if (!value && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  /* ================= SUBMIT ================= */
  const onSubmit = async (data: OTPFormValues) => {
    setLoading(true);
    const otpCode = data.otp.join("");

    try {
      const res = await verifyOTP(otpCode);

      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);

      localStorage.removeItem("temp_token");
      localStorage.removeItem("loginEmail");

      toast.success("OTP verified successfully");
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
      await resendOTP();
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
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <Card className="w-full max-w-md border border-primary-border shadow-lg p-6">
        <CardHeader className="text-center">
          <Image
            src="/rst.png"
            alt="Logo"
            width={120}
            height={40}
            className="mx-auto"
          />
          <p className="mt-4 text-gray-600">
            Enter the 6-digit OTP sent to {maskEmail(email)}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="w-12 h-12 text-center border rounded-md text-lg"
                />
              ))}
            </div>

            {errors.otp && (
              <p className="text-red-600 text-sm text-center">
                {errors.otp.message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-800 hover:bg-blue-900 text-white"
            >
              Verify OTP
            </Button>

            <Button
              type="button"
              className="w-full bg-blue-800 hover:bg-blue-900 text-white"
              onClick={handleResend}
            >
              Resend OTP
            </Button>

            <Button
              type="button"
              className="w-full border border-primary-color text-primary-color rounded"
              onClick={logout}
            >
              Logout
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPPage;

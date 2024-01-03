"use client";

import React, { useEffect, useState } from "react";
import { Card, Image } from "@nextui-org/react";
import { FaGoogle } from "react-icons/fa";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

function SignInCard() {
  const error = useSearchParams().get("error");
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (error) {
      setIsLoggingIn(false);
      toast.error(error);
      router.replace("/sign-in");
    }
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 18) return "Good afternoon!";
    return "Good evening!";
  };

  const handleSignIn = () => {
    setIsLoggingIn(true);
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600">
      <Toaster position="top-center" />

      <Card className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex flex-col items-center justify-center mb-8">
          <Image
            // src="/public/ksb.jpg"
            src="https://th.bing.com/th/id/OIP.ilaFvYEy8zubE7F4VhPPaAAAAA?w=144&h=150&c=7&r=0&o=5&dpr=1.3&pid=1.7"
            alt="KSB"
            width={100}
            height={100}
            className="rounded-full mb-2"
          />
          <h1 className="text-3xl my-4 text-center font-extrabold text-indigo-600">
            KSB Exams Attendance (Admin)
          </h1>
          <div className="mt-4 text-center font-semibold text-xl text-gray-600">
            <p>{getGreeting()}</p>
          </div>
          <p className="text-gray-600">Welcome back! Log in to get started.</p>
        </div>

        <div className="bg-blue-100 h-16 rounded-md mb-8"></div>

        <div
          onClick={handleSignIn}
          className="flex items-center justify-center cursor-pointer w-full bg-gradient-to-r from-[#1a73e8] to-[#4285F4] text-white py-3 rounded-md transition-transform transform hover:scale-105 focus:outline-none"
        >
          <FaGoogle className="mr-2" />
          Continue with Google
        </div>

        {isLoggingIn && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <div className="animate-spin w-5 h-5 border-t-2 border-blue-500"></div>
            <p className="text-gray-500">Logging in...</p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default SignInCard;

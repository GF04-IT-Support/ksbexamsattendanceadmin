"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/react";
import { FaGoogle } from "react-icons/fa";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function SignInCard() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card>
        <CardHeader>Sign In</CardHeader>
        <CardBody>
          <div
            className="flex gap-3 p-4 rounded-[10px] border-none text-white font-bold cursor-pointer bg-[#ff5555]"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <FaGoogle className="mt-1" color="#4285F4" size={18} />
            Sign in With Google
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default SignInCard;

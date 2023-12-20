"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import prisma from "@/utils/prisma";
import { Button, Card, CardBody, CardHeader } from "@nextui-org/react";

export default function Signin() {
  const { openSignIn, signOut, user } = useClerk();

  useEffect(() => {
    if (user) {
      const email = user.primaryEmailAddress.emailAddress;
      // Check if the user's email is in the Admin table
      const admin = await prisma.admin.findUnique({
        where: {
          email: email,
        },
      });

      if (!admin) {
        // If the user's email is not in the Admin table, sign them out and show an error
        signOut();
        alert("Not authorized");
      }
    }
  }, [user]);

  const handleSignIn = () => {
    openSignIn();
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card>
        <CardHeader></CardHeader>
        <CardBody>
          <Button onClick={handleSignIn}>Sign in with Google</Button>
        </CardBody>
      </Card>
    </div>
  );
}

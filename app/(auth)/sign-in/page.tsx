import SignInCard from "@/components/shared/SignInCard";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function SignIn() {
  const session = await getServerSession();

  if (session) {
    redirect("/");
  }
  return <SignInCard />;
}

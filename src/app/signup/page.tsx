import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <AuthForm mode="signup" />;
}

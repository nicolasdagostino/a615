import SetPasswordForm from "@/components/auth/SetPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Password | TailAdmin",
  description: "Set your password after accepting an invitation.",
};

export default function SetPasswordPage() {
  return <SetPasswordForm />;
}

import { RegisterForm } from "@/components/auth/RegisterForm";
import { PageTitle } from "@/components/shared/PageTitle";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <RegisterForm />
    </div>
  );
}

import { Link } from "react-router-dom";
import { AuthForm } from "../components/auth/AuthForm";

export function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-cream px-4 py-10">
      <div className="text-center">
        <h1 className="font-display text-4xl font-extrabold text-cocoa">Vpet</h1>
        <p className="mt-1 text-sm text-cocoa-soft">Raise a little companion, together.</p>
      </div>
      <div className="w-full max-w-sm rounded-cozy bg-white/80 p-6 shadow-md">
        <h2 className="mb-4 text-center text-lg font-bold text-cocoa">Create your account</h2>
        <AuthForm mode="signUp" />
        <p className="mt-4 text-center text-sm text-cocoa-soft">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-peach-dark">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

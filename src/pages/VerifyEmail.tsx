import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const VerifyEmail = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 bg-card rounded-xl shadow-xl text-center">
        <h2 className="text-2xl font-bold mb-4">Check your email</h2>
        <p className="mb-6 text-muted-foreground">
          We've sent a verification link to your email address.<br />
          Please click the link to verify your account and access your dashboard.
        </p>
        <Button onClick={() => navigate("/login")}>Back to Login</Button>
      </div>
    </div>
  );
};

export default VerifyEmail;

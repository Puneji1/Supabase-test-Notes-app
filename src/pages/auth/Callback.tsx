import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Button } from "@/components/ui/button.tsx";

export default function AuthCallback() {
  const navigate = useNavigate();

  const navigateHome = useCallback(
    () => navigate("/", { replace: true }),
    [navigate],
  );

  return (
    <div className="flex flex-col items-center justify-center h-svh gap-4">
      <Spinner className="size-8" />
      <p className="text-sm text-muted-foreground">Redirecting...</p>
      <Button variant="outline" size="sm" onClick={navigateHome}>
        Return home
      </Button>
    </div>
  );
}

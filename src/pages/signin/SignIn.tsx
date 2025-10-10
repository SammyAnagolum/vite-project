import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useConfig } from "@/providers/config/useConfig";
import { userTokenGenerate } from "@/services/authApi";
import { setUser } from "@/lib/authStorage";
import { ExternalLink, Eye, EyeOff, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import BrandLogo from "@/components/common/BrandLogo";
import TypeBadge from "@/components/common/TypeBadge";

export default function SignInPage() {
  const navigate = useNavigate();
  const config = useConfig();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const [showPassword, setShowPassword] = useState(false);
  const envLabel = config.VITE_APP_ENV || "Local";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await userTokenGenerate({ username: email, password });
      const token: string = res.data?.accessToken;

      // roles logic (kept from old app; tolerant to string/array config)
      const decoded: any = token ? jwtDecode(token) : null; // eslint-disable-line @typescript-eslint/no-explicit-any
      const roles: string[] = decoded?.realm_access?.roles || [];

      const adminRoles = Array.isArray(config?.REACT_APP_ADMIN_ROLE)
        ? (config.REACT_APP_ADMIN_ROLE as string[])
        : String(config?.REACT_APP_ADMIN_ROLE ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

      const selfServiceEnabled = Boolean(config?.REACT_APP_SELF_SERVICE_PORTAL_ENABLED);
      const hasAdminRole = roles.some((r) => adminRoles.includes(r));

      toast.success("Signed in successfully!");

      // OPTIONAL: stash token to survive refresh (comment out to stick to old approach strictly)
      // sessionStorage.setItem("auth-token", token);

      // Old app navigated to different routes; here we send everyone to CR Entities
      if (hasAdminRole) {
        setUser({ email, token });
        navigate("/cr/entities", { replace: true });
      } else {
        if (selfServiceEnabled) {
          setUser({ email, token });
          navigate("/cr/entities", { replace: true });
        } else {
          toast.warning("Signed in, but self-service portal is disabled.");
          // stay on page; or route somewhere read-only if you prefer
        }
      }
    } catch {
      setError("Incorrect username or password");
      toast.error("Failed to sign in. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/40">
      <div className="mx-auto grid min-h-dvh w-full max-w-md place-items-center px-4">
        <Card className="w-full max-w-md p-6 shadow-sm">
          {/* Brand + env */}
          <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center">
            <BrandLogo
              variant="horizontal"
              className="h-8 w-auto justify-self-start"
            />
            <span className="justify-self-center hidden sm:inline rounded-md bg-primary/5 px-2 py-1 text-xs font-medium text-primary">
              Ops Console
            </span>
            <span className="justify-self-end rounded-md border px-2 py-1 text-xs text-muted-foreground">
              {envLabel}
            </span>
          </div>

          <h1 className="mb-1 text-xl font-semibold">Sign in to your account</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Use your console credentials to continue.
          </p>

          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-describedby={error ? "signin-error" : undefined}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!!error && (
              <p id="signin-error" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              {/* If/when you add a route, wire it up here */}
              {/* <button type="button" className="text-sm text-primary underline-offset-2 hover:underline" onClick={() => navigate("/forgotpassword")}>Forgot Password?</button> */}
              <div />
              <Button type="submit" disabled={submitting} className="min-w-28">
                {submitting ? "Signing in…" : "Sign In"}
              </Button>
            </div>
          </form>

          <Separator className="my-6" />

          {/* Sahamati footer & ecosystem badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a
              href="https://sahamati.org.in/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              aria-label="Learn about Sahamati (opens in new tab)"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Part of the Sahamati AA ecosystem</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <div className="inline-flex items-center gap-1.5">
              <TypeBadge type="AA" />
              <TypeBadge type="FIP" />
              <TypeBadge type="FIU" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

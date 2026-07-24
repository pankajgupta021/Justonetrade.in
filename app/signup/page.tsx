"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Activity, Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Simple password strength calculation
  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length > 7) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    return strength;
  };

  const strength = getPasswordStrength(password);
  const strengthText = ["Weak", "Fair", "Good", "Strong", "Very Strong"][strength];
  const strengthColor = [
    "bg-destructive",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-emerald-600",
  ][strength] || "bg-muted";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const agreeTerms = formData.get("terms");

    if (!agreeTerms) {
      setError("You must agree to the Terms & Conditions");
      return;
    }

    setIsLoading(true);

    // TODO: Integrate actual signup/registration logic here
    // Mock registration flow
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <Activity className="h-8 w-8" />
            <span className="font-bold text-2xl tracking-tight">JustOneTrade.in</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg border-primary/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>
              Enter your information to get started with our premium signals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (WhatsApp)</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Ensure this number has an active WhatsApp account.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">Toggle password visibility</span>
                  </Button>
                </div>
                {password.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 flex gap-1 h-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-full flex-1 rounded-full ${
                            strength >= level ? strengthColor : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {strengthText}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">Toggle password visibility</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox id="terms" name="terms" disabled={isLoading} />
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mt-1"
                >
                  I agree to the{" "}
                  <Link href="#" className="text-primary hover:underline">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline underline-offset-4"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}

'use client'
import { Button } from "@/components/ui/shared/button";
import { Input } from "@/components/ui/shared/input";
import { Label } from "@/components/ui/shared/label";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import * as z from "zod"
import { loginService } from "@/services/auth.service";

interface Login2Props {
  heading?: string;
  logo: {
    url: string;
    src: string;
    alt: string;
    title?: string;
    className?: string;
  };
  buttonText?: string;
  googleText?: string;
  signupText?: string;
  signupUrl?: string;
  className?: string;
}




const Login2 = ({
  heading = "Login",
  logo = {
    url: "https://www.shadcnblocks.com",
    src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-wordmark.svg",
    alt: "logo",
    title: "shadcnblocks.com",
  },
  buttonText = "Se connecter",
  signupText = "Need an account?",
  signupUrl = "https://shadcnblocks.com",
  className,
}: Login2Props) => {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  console.log(username, password);

  const loginShema = z.object({
    username: z.string().min(2, "Username doit contenir au moins 3 caracteres"),
    password: z.string().min(6, "Password doit contenir au moins 6 caracteres"),
  })



  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const datavalid = loginShema.safeParse({ username, password })
    if (!datavalid.success) {
      console.log(datavalid.error)
      return
    }
    const data = await loginService(datavalid.data.username, datavalid.data.password)
    login(data.token, data.roles, data.username)
  }

  return (
    <section className={cn("h-screen bg-muted", className)}>
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-6 lg:justify-start">
          {/* Logo */}
          <a href={logo.url}>
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.title}
              className="h-10 dark:invert"
            />
          </a>
          <form onSubmit={handleLogin}>
            <div className="flex w-full max-w-sm min-w-sm flex-col items-center gap-y-4 rounded-md border border-muted bg-background px-6 py-8 shadow-md">
              {heading && <h1 className="text-xl font-semibold">{heading}</h1>}
              <div className="flex w-full flex-col gap-2">
                <Label>Email</Label>
                <Input
                  type="text"
                  placeholder="Email"
                  className="text-sm"
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="flex w-full flex-col gap-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Password"
                  className="text-sm"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {buttonText}
              </Button>
            </div>
          </form>
          <div className="flex justify-center gap-1 text-sm text-muted-foreground">
            <p>{signupText}</p>
            <a
              href={signupUrl}
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Login2 };

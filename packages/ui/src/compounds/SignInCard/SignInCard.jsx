"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@saintrocky/api-client";
import { saintRockyBranding } from "@saintrocky/branding";

import { Button } from '../../primitives/Button/Button.jsx';
import { Card } from '../../primitives/Card/Card.jsx';
import { Input } from '../../primitives/Input/Input.jsx';

function getErrorMessage(error) {
  const fieldError = error?.details?.errors?.[0]?.message;
  return fieldError || error?.message || "Unable to sign in right now.";
}

export function SignInCard({
  onSuccess,
  redirectHref = "/dashboard",
  signUpHref = "/signup"
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await api.auth.login({ email, password });

      if (typeof onSuccess === "function") {
        await onSuccess(response?.user || null);
      }

      router.push(redirectHref);
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
      return;
    }

    setStatus("idle");
  }

  return (
    <Card className="c-SignInCard">
      <form className="c-SignInCard__form" onSubmit={handleSubmit}>
        <div className="c-SignInCard__copy">
          <p className="c-SignInCard__eyebrow">{saintRockyBranding.companyName}</p>
          <h1>{saintRockyBranding.auth.headline}</h1>
          <p>{saintRockyBranding.auth.summary}</p>
        </div>
        <label className="c-SignInCard__field">
          <span>Email</span>
          <Input
            type="email"
            autoComplete="username"
            placeholder="name@domain.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="c-SignInCard__field">
          <span>Password</span>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {message ? <p className="c-SignInCard__message">{message}</p> : null}
        <Button type="submit" loading={status === "loading"} loadingLabel="Signing in...">
          Sign in
        </Button>
        <p className="c-SignInCard__footer">
          Need an account?{" "}
          <Link href={signUpHref} className="c-SignInCard__link">
            Join the network
          </Link>
        </p>
      </form>
    </Card>
  );
}

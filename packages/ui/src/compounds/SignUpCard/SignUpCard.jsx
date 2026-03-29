"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@saintrocky/api-client";
import { saintRockyBranding } from "@saintrocky/branding";

import { Button } from "../../primitives/Button/Button.jsx";
import { Card } from "../../primitives/Card/Card.jsx";
import { Input } from "../../primitives/Input/Input.jsx";

function getErrorMessage(error) {
  const fieldError = error?.details?.errors?.[0]?.message;
  return fieldError || error?.message || "Unable to create your account right now.";
}

export function SignUpCard({
  onSuccess,
  redirectHref = "/dashboard",
  signInHref = "/signin"
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const passwordMismatch = useMemo(() => {
    if (!confirmPassword) {
      return "";
    }

    return password === confirmPassword ? "" : "Passwords do not match.";
  }, [confirmPassword, password]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (passwordMismatch) {
      setStatus("error");
      setMessage(passwordMismatch);
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await api.auth.register({ name, email, password });

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
    <Card className="c-SignUpCard">
      <form className="c-SignUpCard__form" onSubmit={handleSubmit}>
        <div className="c-SignUpCard__copy">
          <p className="c-SignUpCard__eyebrow">{saintRockyBranding.companyName}</p>
          <h1>Join the network</h1>
          <p>Create your member account and land directly inside the control plane.</p>
        </div>
        <label className="c-SignUpCard__field">
          <span>Name</span>
          <Input
            type="text"
            autoComplete="name"
            placeholder="Saint Rocky Disciple"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className="c-SignUpCard__field">
          <span>Email</span>
          <Input
            type="email"
            autoComplete="email"
            placeholder="name@domain.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="c-SignUpCard__field">
          <span>Password</span>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Use at least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <label className="c-SignUpCard__field">
          <span>Confirm password</span>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>
        {message ? <p className="c-SignUpCard__message">{message}</p> : null}
        <Button type="submit" loading={status === "loading"} loadingLabel="Creating account...">
          Create account
        </Button>
        <p className="c-SignUpCard__footer">
          Already have an account?{" "}
          <Link href={signInHref} className="c-SignUpCard__link">
            Sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}

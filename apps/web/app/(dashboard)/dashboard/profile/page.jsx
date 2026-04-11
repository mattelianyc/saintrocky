"use client";

import "./profile-page.scss";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@saintrocky/api-client";
import { saintRockyBranding } from "@saintrocky/branding";
import {
  Button,
  Card,
  ConfirmDialog,
  DashboardSectionPage,
  FormErrorSummary,
  Input,
  ProfileCard
} from "@saintrocky/ui";
import { createValidationT, flattenValidationErrors, profileSchema } from "@saintrocky/validation";

import { useAuthSession } from "@/src/auth/auth-session.jsx";

function getProfileFormValues(user) {
  return {
    name: user?.name || "",
    email: user?.email || ""
  };
}

function mapValidationEntries(entries, translate) {
  return (entries || []).reduce((fieldErrors, entry) => {
    if (!entry?.field || fieldErrors[entry.field]) {
      return fieldErrors;
    }

    return {
      ...fieldErrors,
      [entry.field]: translate(String(entry.message))
    };
  }, {});
}

function mapValidationError(error, translate) {
  const entries = error?.inner?.length
    ? error.inner.map((entry) => ({
        field: entry.path || "form",
        message: entry.message
      }))
    : [
        {
          field: error?.path || "form",
          message: error?.message
        }
      ];

  return mapValidationEntries(entries, translate);
}

export default function DashboardProfilePage() {
  const router = useRouter();
  const { clearSession, sessionUser, setSessionUser } = useAuthSession();
  const validationTranslate = useMemo(() => createValidationT("en"), []);
  const [formValues, setFormValues] = useState(() => getProfileFormValues(sessionUser));
  const [fieldErrors, setFieldErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!sessionUser) {
      return;
    }

    setFormValues(getProfileFormValues(sessionUser));
  }, [sessionUser?.email, sessionUser?.name]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const response = await api.users.getMe();
        const user = response?.user || null;

        if (!isMounted || !user) {
          return;
        }

        setSessionUser((currentUser) => ({
          ...currentUser,
          ...user
        }));
        setFormValues(getProfileFormValues(user));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (!sessionUser) {
          setStatusMessage(error?.message || "Unable to load your profile.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [setSessionUser]);

  const summaryMessages = useMemo(() => flattenValidationErrors(fieldErrors), [fieldErrors]);
  const profileName = sessionUser?.displayName || sessionUser?.email || saintRockyBranding.shortProductName;
  const profileRole = sessionUser?.role ? String(sessionUser.role).toUpperCase() : null;
  const profileBio = [
    sessionUser?.workspaceName ? `Workspace: ${sessionUser.workspaceName}` : null,
    formValues.email ? `Email: ${formValues.email}` : null
  ]
    .filter(Boolean)
    .join("\n");

  function handleFieldChange(fieldName, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value
    }));
    setFieldErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
    setSuccessMessage(null);
    setStatusMessage(null);
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setIsSavingProfile(true);
    setFieldErrors({});
    setStatusMessage(null);
    setSuccessMessage(null);

    try {
      const payload = await profileSchema.validate(
        {
          name: formValues.name,
          email: formValues.email,
          avatarUrl: null
        },
        {
          abortEarly: false,
          stripUnknown: true
        }
      );
      const response = await api.users.updateProfile(payload);
      const user = response?.user || null;

      if (user) {
        setSessionUser((currentUser) => ({
          ...currentUser,
          ...user
        }));
        setFormValues(getProfileFormValues(user));
      }

      setSuccessMessage("Profile updated.");
    } catch (error) {
      if (error?.name === "ValidationError") {
        setFieldErrors(mapValidationError(error, validationTranslate));
        return;
      }

      if (Array.isArray(error?.details?.errors)) {
        setFieldErrors(mapValidationEntries(error.details.errors, validationTranslate));
        setStatusMessage(error?.message || "Unable to update your profile.");
        return;
      }

      setStatusMessage(error?.message || "Unable to update your profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await api.auth.logout();
    } catch {
      // Clear local session state even if the logout request fails.
    } finally {
      clearSession();
      router.push("/signin");
      router.refresh();
      setIsSigningOut(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeletingAccount(true);
    setStatusMessage(null);
    setSuccessMessage(null);

    try {
      await api.users.deleteAccount();
      clearSession();
      router.push("/signin");
      router.refresh();
    } catch (error) {
      setStatusMessage(error?.message || "Unable to delete your account.");
    } finally {
      setIsDeletingAccount(false);
    }
  }

  return (
    <>
      <DashboardSectionPage
        className="sr-ProfilePage__intro"
        title="Profile"
        description="Update your account identity, keep your dashboard session current, and manage access to Saint Rocky."
        items={[]}
      />

      <div className="sr-ProfilePage">
        <div className="sr-ProfilePage__overview">
          <ProfileCard
            name={profileName}
            role={profileRole}
            bio={profileBio}
          />
        </div>

        <Card className="sr-ProfilePage__panel">
          <div className="sr-ProfilePage__panelStack">
            <div className="sr-ProfilePage__panelHeader">
              <h2>Basic settings</h2>
              <p>Keep your display name and email current across the web dashboard.</p>
            </div>

            <FormErrorSummary messages={summaryMessages} status={statusMessage} />

            {successMessage ? (
              <p className="sr-ProfilePage__successMessage">{successMessage}</p>
            ) : null}

            <form className="sr-ProfilePage__form" onSubmit={handleSaveProfile}>
              <label className="sr-ProfilePage__field">
                <span className="sr-ProfilePage__fieldLabel">Display name</span>
                <Input
                  value={formValues.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  placeholder="Saint Rocky Operator"
                  invalid={Boolean(fieldErrors.name)}
                  disabled={isLoadingProfile || isSavingProfile || isDeletingAccount}
                />
                {fieldErrors.name ? (
                  <span className="sr-ProfilePage__fieldError">{fieldErrors.name}</span>
                ) : null}
              </label>

              <label className="sr-ProfilePage__field">
                <span className="sr-ProfilePage__fieldLabel">Email</span>
                <Input
                  type="email"
                  value={formValues.email}
                  onChange={(event) => handleFieldChange("email", event.target.value)}
                  placeholder="operator@saintrocky.local"
                  invalid={Boolean(fieldErrors.email)}
                  disabled={isLoadingProfile || isSavingProfile || isDeletingAccount}
                />
                {fieldErrors.email ? (
                  <span className="sr-ProfilePage__fieldError">{fieldErrors.email}</span>
                ) : null}
              </label>

              <div className="sr-ProfilePage__formActions">
                <Button
                  type="submit"
                  loading={isSavingProfile}
                  loadingLabel="Saving profile..."
                  disabled={isLoadingProfile || isDeletingAccount}
                >
                  Save changes
                </Button>
              </div>
            </form>
          </div>
        </Card>

        <Card className="sr-ProfilePage__panel sr-ProfilePage__danger">
          <div className="sr-ProfilePage__panelStack">
            <div className="sr-ProfilePage__panelHeader">
              <h2>Account access</h2>
              <p>Sign out of this session or permanently delete your account.</p>
            </div>

            <div className="sr-ProfilePage__actions">
              <Button
                type="button"
                variant="ghost"
                loading={isSigningOut}
                loadingLabel="Signing out..."
                onClick={handleSignOut}
                disabled={isDeletingAccount}
              >
                Sign out
              </Button>

              <div className="sr-ProfilePage__dangerBlock">
                <h3>Delete account</h3>
                <p>Permanently disable this account and revoke access across your active sessions.</p>
                <Button
                  type="button"
                  variant="danger"
                  loading={isDeletingAccount}
                  loadingLabel="Deleting account..."
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isSigningOut}
                >
                  Delete account
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete account?"
        description="This will disable your account, revoke your sessions, and remove access to the web dashboard."
        confirmLabel="Delete account"
        onConfirm={handleDeleteAccount}
      />
    </>
  );
}

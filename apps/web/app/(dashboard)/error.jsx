"use client";

export default function DashboardError() {
  return (
    <main>
      <h1>Control plane failed to load.</h1>
      <p>Check the dashboard route group and shared API client wiring.</p>
    </main>
  );
}

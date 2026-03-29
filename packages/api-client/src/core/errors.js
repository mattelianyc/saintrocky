export function normalizeHttpError(error) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data ?? null;

  return {
    ok: false,
    status,
    code: data?.code || error?.code || "UNKNOWN",
    message: data?.message || data?.error || error?.message || "Request failed",
    details: data?.details || data || null
  };
}

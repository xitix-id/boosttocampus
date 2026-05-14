import "server-only";

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@btc2026.local";
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "change-this-password";
}

export function getAdminBootstrapToken() {
  return process.env.ADMIN_BOOTSTRAP_TOKEN || process.env.BETTER_AUTH_SECRET || "dev-bootstrap-token";
}

export function isAdminCredential(email: string, password: string) {
  return email.trim().toLowerCase() === getAdminEmail() && password === getAdminPassword();
}

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const adminSessionCookieName = "pudim_admin_session";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "troque-esta-senha";
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || `${getAdminPassword()}-session-secret`;
}

function createSessionToken() {
  return createHmac("sha256", getSessionSecret()).update("admin-session").digest("hex");
}

export function validateAdminPassword(password: string) {
  const expected = Buffer.from(getAdminPassword());
  const received = Buffer.from(password);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;

  if (!token) {
    return false;
  }

  const expected = Buffer.from(createSessionToken());
  const received = Buffer.from(token);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

export async function setAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(adminSessionCookieName, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(adminSessionCookieName);
}

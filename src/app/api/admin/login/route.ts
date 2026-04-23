import { NextResponse } from "next/server";
import { setAdminSession, validateAdminPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";

    if (!validateAdminPassword(password)) {
      console.error("Admin login failed", {
        hasAdminPassword: Boolean(process.env.ADMIN_PASSWORD?.trim()),
        expectedLength: process.env.ADMIN_PASSWORD?.trim().length ?? 0,
        receivedLength: password.trim().length,
      });

      return NextResponse.json({ error: "Senha invalida." }, { status: 401 });
    }

    await setAdminSession();

    return NextResponse.json({ message: "Login realizado com sucesso." });
  } catch {
    return NextResponse.json({ error: "Nao foi possivel fazer login." }, { status: 500 });
  }
}

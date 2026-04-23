"use client";

import { useState } from "react";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Nao foi possivel entrar.");
      }

      window.location.reload();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Nao foi possivel entrar."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-cream)] px-6 py-10 text-[var(--color-ink)] sm:px-10 lg:px-12">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 rounded-[36px] border border-[rgba(184,90,18,0.12)] bg-white p-6 shadow-[0_24px_60px_rgba(140,58,18,0.08)] md:grid-cols-[1fr_0.95fr] md:p-8">
          <div className="rounded-[28px] bg-[linear-gradient(135deg,#fff4ea_0%,#ffd9be_100%)] p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--color-caramel)]">
              Area administrativa
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-tight sm:text-5xl">
              Acesse os pedidos salvos da loja.
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-[var(--color-muted)]">
              Entre com sua senha para visualizar os pedidos, acompanhar o status de preparo e
              organizar as retiradas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col justify-center gap-5 p-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Login
              </p>
              <h2 className="mt-2 text-3xl font-semibold">Entrar no painel</h2>
            </div>

            <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
              Senha de acesso
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-caramel)]"
                placeholder="Digite sua senha"
              />
            </label>

            {error && (
              <div className="rounded-2xl bg-[#fff0eb] px-4 py-3 text-sm text-[#8f3f00]">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-[var(--color-caramel)] px-6 py-4 text-base font-semibold text-white transition hover:bg-[var(--color-caramel-dark)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

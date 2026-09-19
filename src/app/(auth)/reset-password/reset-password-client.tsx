"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmPasswordReset } from "./utils";

export function ResetPasswordClient() {
	const token = useSearchParams().get("token") ?? "";
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (password !== confirm) {
			setError("Las contraseñas no coinciden");
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const result = await confirmPasswordReset(token, password);
			if (!result.ok) {
				setError(result.error ?? "No se pudo restablecer la contraseña");
				return;
			}
			setDone(true);
		} catch {
			setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
		} finally {
			setLoading(false);
		}
	}

	if (!token) {
		return (
			<AuthShell icon={LockKeyhole} title="Falta el enlace de restablecimiento" description="Abre el enlace del correo de restablecimiento para elegir una contraseña nueva.">
				<Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
					Solicitar un enlace nuevo
				</Link>
			</AuthShell>
		);
	}

	return (
		<AuthShell
			icon={LockKeyhole}
			title={done ? "Contraseña actualizada" : "Elige una contraseña nueva"}
			description={
				done
					? "Se cerró tu sesión en todos los dispositivos. Inicia sesión con tu contraseña nueva para continuar."
					: "Usa al menos 8 caracteres. Se cerrarán las demás sesiones de esta cuenta."
			}
			footer={
				done ? (
					<Link href="/login" className="text-sm font-medium text-blue-600 hover:underline">
						Ir a iniciar sesión
					</Link>
				) : undefined
			}
		>
			{!done && (
				<form onSubmit={onSubmit} className="space-y-5">
					<div className="space-y-2">
						<Label htmlFor="password">Contraseña nueva</Label>
						<Input
							id="password"
							type="password"
							autoComplete="new-password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							minLength={8}
							required
							autoFocus
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirm">Confirma la contraseña nueva</Label>
						<Input
							id="confirm"
							type="password"
							autoComplete="new-password"
							value={confirm}
							onChange={(event) => setConfirm(event.target.value)}
							minLength={8}
							required
						/>
					</div>
					{error && (
						<p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
					)}
					<Button type="submit" className="h-11 w-full rounded-full px-6 active:scale-[0.98]" disabled={loading}>
						{loading ? "Guardando..." : "Establecer contraseña nueva"}
					</Button>
				</form>
			)}
		</AuthShell>
	);
}

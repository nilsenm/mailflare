"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, LoaderCircle, MailPlus } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { checkDomain, createDomain, createMailbox, getDomains } from "./utils";
import type { DomainPreflight } from "./types";

export function OnboardingClient() {
	const router = useRouter();
	const [step, setStep] = useState<1 | 2>(1);
	const [hostname, setHostname] = useState("");
	const [domainCheck, setDomainCheck] = useState<DomainPreflight | null>(null);
	const [domainChecking, setDomainChecking] = useState(false);
	const [enableSending, setEnableSending] = useState(false);
	const [domainId, setDomainId] = useState("");
	const [localPart, setLocalPart] = useState("me");
	const [error, setError] = useState<string | null>(null);
	const [mxConflict, setMxConflict] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		void getDomains()
			.then((data) => {
				const primary = data.domains?.[0];
				if (!primary) return;
				setDomainId(primary.id);
				setHostname(primary.hostname);
				setStep(2);
			})
			.catch(() => undefined);
	}, []);

	async function addDomain(replaceMxRecords = false) {
		setLoading(true);
		setError(null);

		const normalized = hostname.toLowerCase().trim();
		let checkedDomain = domainCheck;
		let sendingRequested = enableSending;
		if (checkedDomain?.hostname !== normalized) {
			const result = await checkDomain(normalized);
			if (!result.ok || !result.domain) {
				setLoading(false);
				setError(result.error ?? "No se pudo comprobar el dominio");
				return;
			}
			checkedDomain = result.domain;
			sendingRequested = false;
			setDomainCheck(result.domain);
			setEnableSending(sendingRequested);
		}
		if (!checkedDomain) {
			setLoading(false);
			setError("No se pudo comprobar el dominio");
			return;
		}

		const { ok, data } = await createDomain(checkedDomain.hostname, sendingRequested, replaceMxRecords);
		setLoading(false);
		if (!ok || !data.domain) {
			if (data.code === "MX_RECORDS_CONFLICT") {
				setMxConflict(true);
				setError(null);
				return;
			}
			setError(data.error ?? "No se pudo agregar el dominio");
			return;
		}
		setMxConflict(false);
		setDomainId(data.domain.id);
		setStep(2);
	}

	async function inspectDomain() {
		const normalized = hostname.toLowerCase().trim();
		if (normalized.length < 3 || domainCheck?.hostname === normalized) return;

		setDomainChecking(true);
		setError(null);
		setMxConflict(false);
		const result = await checkDomain(normalized);
		setDomainChecking(false);
		if (!result.ok || !result.domain) {
			setDomainCheck(null);
			setEnableSending(false);
			setError(result.error ?? "No se pudo comprobar el dominio");
			return;
		}

		setDomainCheck(result.domain);
		setEnableSending(false);
	}

	async function addMailbox() {
		setLoading(true);
		setError(null);

		const { ok, data } = await createMailbox(domainId, localPart);
		setLoading(false);
		if (!ok) {
			setError(data.error ?? "No se pudo crear el buzón");
			return;
		}
		router.push("/inbox");
	}

	return (
		<AuthShell
			icon={MailPlus}
			title={step === 1 ? "Conecta el enrutamiento de correo" : "Crea tu primer buzón"}
			description={
				step === 1
					? "Agrega el dominio de Cloudflare que recibirá correo y, de forma opcional, enviará desde este espacio de trabajo."
					: "Elige la dirección del buzón que debe abrir directamente la bandeja de entrada."
			}
			steps={[
				{ label: "Dominio", active: step === 1 },
				{ label: "Buzón", active: step === 2 },
			]}
			footer={
				<span className="inline-flex items-center gap-2 text-neutral-500">
					La configuración termina en la bandeja de entrada
					<ArrowRight className="h-4 w-4" />
				</span>
			}
		>
			<div className="space-y-5">
				{step === 1 && (
					<>
						<p className="rounded-2xl bg-[#eaf1fb] px-4 py-3 text-sm leading-6 text-neutral-700">
							Tu dominio debe usar Cloudflare DNS en la misma cuenta que{" "}
							<code className="no-font-mono text-xs font-semibold text-blue-800">CF_TOKEN</code>.
						</p>
						<div className="space-y-2">
							<Label htmlFor="domain">Dominio</Label>
							<Input
								id="domain"
								value={hostname}
								onChange={(e) => {
									setHostname(e.target.value);
									if (domainCheck?.hostname !== e.target.value.toLowerCase().trim()) {
										setDomainCheck(null);
										setEnableSending(false);
										setMxConflict(false);
									}
								}}
								onBlur={() => void inspectDomain()}
								placeholder="example.com"
							/>
						</div>
						<div className="flex items-center justify-between gap-4 rounded-2xl bg-neutral-50 px-4 py-3">
							<div>
								<Label htmlFor="onboarding-enable-sending">Activar envío</Label>
								<p className="mt-1 text-xs leading-5 text-neutral-500">
									{domainChecking
										? "Comprobando el acceso a Cloudflare..."
										: domainCheck
											? enableSending
												? "Necesario para enviar correos."
												: "Modo de solo recepción."
											: "Sal del campo de dominio para verificarlo."}
								</p>
							</div>
							{domainChecking ? (
								<LoaderCircle className="h-4 w-4 animate-spin text-neutral-500" />
							) : (
								<Switch
									id="onboarding-enable-sending"
									checked={enableSending}
									onCheckedChange={setEnableSending}
									disabled={!domainCheck}
								/>
							)}
						</div>
						{domainCheck && (
							<div className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
								<CheckCircle2 className="h-4 w-4" />
								Dominio encontrado en Cloudflare como {domainCheck.zone.name}
							</div>
						)}
						{mxConflict && (
							<div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
								<div className="flex items-start gap-3">
									<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
									<p className="text-sm leading-6">
										Los registros MX existentes entregan el correo a otro proveedor. Si continúas, se eliminarán y se reemplazarán con Cloudflare Email Routing, por lo que el proveedor anterior dejará de recibir correo.
									</p>
								</div>
								<Button
									onClick={() => void addDomain(true)}
									disabled={loading}
									className="h-11 w-full rounded-full px-6 active:scale-[0.98]"
								>
									{loading ? "Reemplazando registros MX..." : "Eliminar registros MX y continuar"}
								</Button>
							</div>
						)}
						{!mxConflict && (
							<Button
								onClick={() => void addDomain()}
								disabled={!hostname || loading || domainChecking}
								className="h-11 w-full rounded-full px-6 active:scale-[0.98]"
							>
								{loading ? "Agregando..." : "Agregar dominio"}
							</Button>
						)}
					</>
				)}
				{step === 2 && (
					<>
						<div className="space-y-2">
							<Label htmlFor="localPart">Dirección del buzón</Label>
							<div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
								<Input
									id="localPart"
									value={localPart}
									onChange={(e) => setLocalPart(e.target.value)}
									className="min-w-0"
								/>
								<span className="max-w-36 truncate text-sm font-medium text-neutral-500">@{hostname}</span>
							</div>
						</div>
						<Button
							onClick={addMailbox}
							disabled={!localPart || loading}
							className="h-11 w-full rounded-full px-6 active:scale-[0.98]"
						>
							{loading ? "Creando..." : "Ir a la bandeja de entrada"}
						</Button>
					</>
				)}
				{error && (
					<p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
						{error}
					</p>
				)}
			</div>
		</AuthShell>
	);
}

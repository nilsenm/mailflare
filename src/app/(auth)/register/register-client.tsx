"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, LoaderCircle, MailPlus, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TurnstileField } from "@/components/auth/turnstile";
import {
  getSetupStatus,
  checkExistingMx,
  prepareSetup,
  submitPrimaryDomain,
  submitRegistration,
} from "./utils";
import type { DomainPreflight, DomainSetupResult, SetupRequirementCheck } from "./types";

export function RegisterClient() {
  const router = useRouter();
  const [hasAdminAccount, setHasAdminAccount] = useState<boolean | null>(null);
  const [hasPrimaryDomain, setHasPrimaryDomain] = useState<boolean | null>(
    null,
  );
  const [primaryDomain, setPrimaryDomain] = useState<string | null>(null);
  const [primaryDomainSendingRequested, setPrimaryDomainSendingRequested] = useState<boolean | null>(null);
  const [setupDomain, setSetupDomain] = useState<string | null>(null);
  const [domainCheck, setDomainCheck] = useState<DomainPreflight | null>(null);
  const [domainChecking, setDomainChecking] = useState(false);
  const [enableSending, setEnableSending] = useState(false);
  const [setupEnableSending, setSetupEnableSending] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [checks, setChecks] = useState<SetupRequirementCheck[]>([]);
  const [databaseMigrated, setDatabaseMigrated] = useState(false);
  const [preparationComplete, setPreparationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mxChecking, setMxChecking] = useState(true);
  const [mxRecordsExist, setMxRecordsExist] = useState<boolean | null>(null);
  const [replaceMxRecords, setReplaceMxRecords] = useState(false);
  const [mxCheckRevision, setMxCheckRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const [turnstileReset, setTurnstileReset] = useState(0);

  useEffect(() => {
    void runPreparation();
  }, []);

  const accountDomain = setupDomain ?? primaryDomain;

  useEffect(() => {
    if (step !== 3 || !accountDomain) return;

    let active = true;
    setMxChecking(true);
    setMxRecordsExist(null);
    setReplaceMxRecords(false);
    setError(null);

    void checkExistingMx(accountDomain)
      .then(({ ok, data }) => {
        if (!active) return;
        setMxChecking(false);
        if (!ok || data.hasExistingMx === undefined) {
          setError(typeof data.error === "string" ? data.error : "No se pudieron comprobar los registros MX existentes");
          return;
        }
        setMxRecordsExist(data.hasExistingMx);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMxChecking(false);
        setError(error instanceof Error ? error.message : "No se pudieron comprobar los registros MX existentes");
      });

    return () => {
      active = false;
    };
  }, [step, accountDomain, mxCheckRevision]);

  async function runPreparation() {
    setLoading(true);
    setError(null);
    setPreparationComplete(false);

    try {
      const preparation = await prepareSetup();
      setChecks(preparation.data.checks ?? []);
      setDatabaseMigrated(!!preparation.data.migrated);
      if (!preparation.ok) {
        setError(preparation.data.error ?? "Completa la configuración pendiente antes de continuar.");
        return;
      }

      const data = await getSetupStatus();
      setHasAdminAccount(data.hasAdminAccount);
      setHasPrimaryDomain(data.hasPrimaryDomain);
      setPrimaryDomain(data.primaryDomain?.hostname ?? null);
      setPrimaryDomainSendingRequested(data.primaryDomain?.sendingRequested ?? null);
      setPreparationComplete(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo preparar la instalación");
    } finally {
      setLoading(false);
    }
  }

  async function onDomainSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const hostname = String(new FormData(e.currentTarget).get("domain") ?? "").toLowerCase().trim();
    const usedCachedCheck = domainCheck?.hostname === hostname;
    const result: { ok: boolean; data: DomainSetupResult } = usedCachedCheck
      ? { ok: true, data: { domain: domainCheck } }
      : await submitPrimaryDomain(hostname);
    const { ok, data } = result;
    setLoading(false);
    if (!ok || !data.domain) {
      setError(
        typeof data.error === "string" ? data.error : "No se pudo configurar el dominio",
      );
      return;
    }
    setSetupDomain(data.domain.hostname);
    setSetupEnableSending(usedCachedCheck ? enableSending : false);
    setStep(3);
  }

  async function onDomainBlur(e: React.FocusEvent<HTMLInputElement>) {
    const hostname = e.currentTarget.value.toLowerCase().trim();
    if (hostname.length < 3 || domainCheck?.hostname === hostname) return;

    setDomainChecking(true);
    setError(null);
    const { ok, data } = await submitPrimaryDomain(hostname);
    setDomainChecking(false);
    if (!ok || !data.domain) {
      setDomainCheck(null);
      setEnableSending(false);
      setError(typeof data.error === "string" ? data.error : "No se pudo comprobar el dominio");
      return;
    }

    setDomainCheck(data.domain);
    setEnableSending(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const domain = setupDomain ?? primaryDomain;
    if (!domain) {
      setLoading(false);
      setError("La configuración del dominio no está completa");
      return;
    }

    const { ok, data } = await submitRegistration(form, {
      firstRun: true,
      domain,
      enableSending: setupDomain
        ? setupEnableSending
        : primaryDomainSendingRequested ?? undefined,
      replaceMxRecords,
    });
    setLoading(false);
    if (!ok) {
      if (data.code === "MX_RECORDS_CONFLICT") {
        setMxRecordsExist(true);
        setReplaceMxRecords(false);
        setError(null);
        setTurnstileReset((value) => value + 1);
        return;
      }
      setError(
        typeof data.error === "string" ? data.error : "No se pudo completar el registro",
      );
      setTurnstileReset((value) => value + 1);
      return;
    }
    window.location.assign(data.redirect ?? "/login");
  }

  const showDomainStep = hasPrimaryDomain === false && step === 2;

  if (hasAdminAccount === true) {
    return (
      <AuthShell
        icon={MailPlus}
        title="El registro de cuentas está cerrado"
        footer={
          <Link
            href="/login"
            className="inline-flex items-center gap-2 hover:underline"
          >
            Iniciar sesión en su lugar
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        <div className="space-y-5">
          <p className="text-sm leading-6 text-neutral-600">
            Esta instalación ya tiene una cuenta para {primaryDomain ?? "este espacio de trabajo"}.
          </p>
          <Button
            type="button"
            className="h-11 w-full rounded-full px-6 active:scale-[0.98]"
            onClick={() => router.push("/login")}
          >
            Ir al inicio de sesión
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={MailPlus}
      title={step === 1 ? "Preparar instalación" : showDomainStep ? "Agrega tu dominio" : "Crea tu buzón"}
      // description={
      // 	showDomainStep
      // 		? "Connect the primary Cloudflare zone first so routing records can be created before the first mailbox."
      // 		: `Choose a mailbox username on ${accountDomain ?? "the primary domain"} and add a recovery email.`
      // }
      steps={
        [
          { label: "Sistema", active: step === 1 },
          { label: "Dominio", active: step === 2 },
          { label: "Cuenta", active: step === 3 },
        ]
      }
    >
      {step === 1 ? (
        <div className="space-y-5">
          <p className="text-sm leading-6 text-neutral-600">
            Mailflare comprueba la configuración necesaria de Cloudflare e inicializa una base de datos D1 limpia antes de continuar.
          </p>
          <div className="space-y-2">
            {loading && checks.length === 0 && (
              <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Comprobando la instalación
              </div>
            )}
            {checks.map((check) => (
              <div key={check.key} className="flex items-start gap-3 rounded-2xl bg-neutral-50 px-4 py-3">
                {check.configured ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-neutral-800">{check.key}</p>
                  {!check.configured && <p className="mt-1 text-xs leading-5 text-neutral-500">{check.message}</p>}
                </div>
              </div>
            ))}
            {preparationComplete && (
              <div className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                {databaseMigrated ? "La base de datos limpia se migró correctamente" : "El esquema de la base de datos está listo"}
              </div>
            )}
          </div>
          {error && (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          {preparationComplete ? (
            <Button
              type="button"
              className="h-11 w-full rounded-full px-6 active:scale-[0.98]"
              onClick={() => setStep(hasPrimaryDomain ? 3 : 2)}
            >
              Continuar
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-full px-6 active:scale-[0.98]"
              disabled={loading}
              onClick={() => void runPreparation()}
            >
              {loading ? "Comprobando..." : "Comprobar de nuevo"}
            </Button>
          )}
        </div>
      ) : showDomainStep ? (
        <form method="post" onSubmit={onDomainSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="domain">Dominio principal</Label>
            <Input
              id="domain"
              name="domain"
              placeholder="example.com"
              autoComplete="url"
              required
              onBlur={(event) => void onDomainBlur(event)}
              onChange={(event) => {
                if (domainCheck?.hostname !== event.currentTarget.value.toLowerCase().trim()) {
                  setDomainCheck(null);
                  setEnableSending(false);
                }
              }}
            />
            <p className="text-xs leading-5 text-neutral-500">
              El dominio ya debe ser una zona de Cloudflare en esta cuenta.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-neutral-50 px-4 py-3">
            <div>
              <Label htmlFor="setup-enable-sending">Activar envío</Label>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                {domainChecking
                  ? "Comprobando el acceso a Cloudflare..."
                  : domainCheck
                    ? enableSending
                      ? "Necesario para enviar correos."
                      : "Modo de solo recepción."
                    : "Ingresa el dominio y sal del campo para verificarlo."}
              </p>
            </div>
            <Switch
              id="setup-enable-sending"
              checked={enableSending}
              onCheckedChange={setEnableSending}
              disabled={domainChecking || !domainCheck}
            />
          </div>
          {domainCheck && (
            <div className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Dominio encontrado en Cloudflare como {domainCheck.zone.name}
            </div>
          )}
          {error && (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="h-11 w-full rounded-full px-6 active:scale-[0.98]"
            disabled={loading || domainChecking}
          >
            {loading ? "Agregando dominio..." : "Continuar"}
          </Button>
        </form>
      ) : (
        <form method="post" onSubmit={onSubmit} className="space-y-5">
					{mxChecking && (
						<div className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
							<LoaderCircle className="h-4 w-4 animate-spin" />
							Comprobando los registros MX existentes
						</div>
					)}
					{mxRecordsExist === false && (
						<div className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
							<CheckCircle2 className="h-4 w-4" />
							No se encontraron registros MX existentes
						</div>
					)}
					{mxRecordsExist === true && (
						<label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
							<Checkbox
								checked={replaceMxRecords}
								onChange={(event) => setReplaceMxRecords(event.target.checked)}
								className="mt-1"
							/>
							<span>
								<span className="flex items-center gap-2 text-sm font-medium">
									<AlertTriangle className="h-4 w-4" />
									Reemplazar los registros MX existentes
								</span>
								<span className="mt-1 block text-xs leading-5">
									Esto elimina los registros MX del proveedor de correo actual y los reemplaza con Cloudflare Email Routing. El proveedor anterior dejará de recibir correo.
								</span>
							</span>
						</label>
					)}
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de usuario</Label>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 relative">
              <Input
                id="username"
                name="username"
                placeholder="you"
                autoComplete="username"
                required
								className="pr-34"
              />
              <span className="max-w-36 truncate text-sm font-medium text-neutral-500 absolute top-2.5 right-5">
                @{accountDomain ?? "domain"}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resetEmail">Correo de recuperación</Label>
            <Input
              id="resetEmail"
              name="resetEmail"
              type="email"
              placeholder="you@gmail.com"
              required
            />
            {/* <p className="text-xs leading-5 text-neutral-500">Used later for password reset.</p> */}
          </div>

          {error && (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
					{!mxChecking && mxRecordsExist === null && (
						<Button
							type="button"
							variant="outline"
							className="h-11 w-full rounded-full px-6 active:scale-[0.98]"
							onClick={() => setMxCheckRevision((value) => value + 1)}
						>
							Comprobar de nuevo los registros MX
						</Button>
					)}
          <TurnstileField resetSignal={turnstileReset} />
					<Button
						type="submit"
						className="h-11 w-full rounded-full px-6 active:scale-[0.98] mt-8"
						disabled={loading || mxChecking || mxRecordsExist === null || (mxRecordsExist && !replaceMxRecords) || hasAdminAccount === null || hasPrimaryDomain === null}
					>
						{loading ? "Creando..." : "Crear cuenta"}
					</Button>
        </form>
      )}
    </AuthShell>
  );
}

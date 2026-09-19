"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Save, Send, Server, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/lib/i18n/client";
import type { OutboundMailTestResult, OutboundProvider } from "./types";
import { fetchOutboundMailSettings, saveOutboundMailSettings, testOutboundMail } from "./utils";

export default function OutboundMailPage() {
	const { t } = useT();
	const queryClient = useQueryClient();
	const query = useQuery({ queryKey: ["outbound-mail"], queryFn: fetchOutboundMailSettings });
	const [draftProvider, setProvider] = useState<OutboundProvider | null>(null);
	const [draftFallback, setFallback] = useState<boolean | null>(null);
	const [to, setTo] = useState("");
	const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
	const [testResult, setTestResult] = useState<OutboundMailTestResult | null>(null);

	const provider = draftProvider ?? query.data?.provider ?? "direct";
	const fallback = draftFallback ?? query.data?.fallback ?? true;

	const save = useMutation({
		mutationFn: () => saveOutboundMailSettings({ provider, fallback }),
		onSuccess: async () => {
			setNotice({ kind: "success", text: t("admin.outbound.saved") });
			await queryClient.invalidateQueries({ queryKey: ["outbound-mail"] });
		},
			onError: (error) => setNotice({ kind: "error", text: error instanceof Error && error.message ? error.message : t("admin.outbound.saveError") }),
	});
	const test = useMutation({
		mutationFn: () => testOutboundMail(to),
		onSuccess: setTestResult,
		onError: (error) => setTestResult({ ok: false, error: error instanceof Error && error.message ? error.message : t("admin.outbound.testError") }),
	});

	const options: Array<{ value: OutboundProvider; title: string; description: string; host: string | null }> = [
		{ value: "direct", title: t("admin.outbound.directTitle"), description: t("admin.outbound.directDescription"), host: query.data?.directHost ?? null },
		{ value: "relay", title: t("admin.outbound.relayTitle"), description: t("admin.outbound.relayDescription"), host: query.data?.relayHost ?? null },
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-medium text-neutral-900">{t("admin.outbound.title")}</h1>
				<p className="mt-1 text-sm text-neutral-500">{t("admin.outbound.description")}</p>
			</div>

			{query.error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{query.error.message || t("admin.outbound.loadError")}</p> : null}
			<Card className="rounded-3xl border-0 bg-white p-6">
				<CardHeader className="py-0"><CardTitle>{t("admin.outbound.providerTitle")}</CardTitle></CardHeader>
				<CardContent className="space-y-3 pt-5">
					{options.map((option) => {
						const available = query.data?.available[option.value] ?? false;
						return (
							<label key={option.value} className={`flex gap-4 rounded-2xl border p-4 ${available ? provider === option.value ? "cursor-pointer border-blue-500 bg-blue-50/50" : "cursor-pointer border-neutral-200" : "cursor-not-allowed border-neutral-100 bg-neutral-50 opacity-60"}`}>
								<input type="radio" name="outbound-provider" value={option.value} checked={provider === option.value} disabled={!available} onChange={() => setProvider(option.value)} className="mt-1 h-4 w-4 accent-blue-600" />
								<Server className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500" />
								<span className="min-w-0"><span className="block text-sm font-semibold text-neutral-900">{option.title}</span><span className="mt-1 block text-sm text-neutral-500">{option.description}</span><span className="mt-1 block text-xs text-neutral-400">{available ? option.host : t("admin.outbound.notConfigured")}</span></span>
							</label>
						);
					})}
					<div className="flex items-center gap-3 border-t border-neutral-100 pt-5">
						<Switch checked={fallback} onCheckedChange={setFallback} aria-label={t("admin.outbound.fallbackLabel")} />
						<span className="text-sm font-medium">{t("admin.outbound.fallbackLabel")}</span>
					</div>
					{notice ? <p className={`flex items-center gap-2 text-sm ${notice.kind === "success" ? "text-green-700" : "text-red-700"}`}>{notice.kind === "success" ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}{notice.text}</p> : null}
					<Button type="button" disabled={save.isPending || !query.data?.available[provider]} onClick={() => { setNotice(null); save.mutate(); }}><Save className="h-4 w-4" />{save.isPending ? t("admin.outbound.saving") : t("admin.outbound.save")}</Button>
				</CardContent>
			</Card>

			<Card className="rounded-3xl border-0 bg-white p-6">
				<CardHeader className="py-0"><CardTitle>{t("admin.outbound.testTitle")}</CardTitle><CardDescription>{t("admin.outbound.testDescription")}</CardDescription></CardHeader>
				<CardContent className="space-y-4 pt-5">
					<div className="space-y-2"><Label htmlFor="outbound-test-to">{t("admin.outbound.testTo")}</Label><div className="flex gap-2"><Input id="outbound-test-to" type="email" value={to} onChange={(event) => setTo(event.target.value)} placeholder={t("admin.outbound.testPlaceholder")} /><Button type="button" disabled={test.isPending || !to} onClick={() => { setTestResult(null); test.mutate(); }}><Send className="h-4 w-4" />{test.isPending ? t("admin.outbound.testing") : t("admin.outbound.test")}</Button></div></div>
					{testResult ? <p className={`rounded-xl px-4 py-3 text-sm ${testResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{testResult.ok ? t("admin.outbound.testSent", { id: testResult.messageId }) : testResult.error}</p> : null}
				</CardContent>
			</Card>
		</div>
	);
}

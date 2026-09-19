"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SectionRowSkeleton } from "@/components/page-skeletons";
import { useT } from "@/lib/i18n/client";
import type { Webhook, WebhookEvent } from "./types";
import {
	WEBHOOK_EVENTS,
	createWebhook,
	deleteWebhook,
	fetchWebhooks,
	testWebhook,
	updateWebhook,
} from "./utils";
import { WebhookDeliveries } from "./deliveries";

export default function WebhooksPage() {
	const { t } = useT();
	const qc = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [url, setUrl] = useState("");
	const [description, setDescription] = useState("");
	const [maxAttempts, setMaxAttempts] = useState(5);
	const [events, setEvents] = useState<WebhookEvent[]>(WEBHOOK_EVENTS.map((e) => e.value));
	const [secret, setSecret] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<string | null>(null);
	const [testResult, setTestResult] = useState<Record<string, string>>({});

	const webhooks = useQuery({ queryKey: ["webhooks"], queryFn: fetchWebhooks });
	const invalidate = () => qc.invalidateQueries({ queryKey: ["webhooks"] });

	const create = useMutation({
		mutationFn: () => createWebhook({ url, description: description || undefined, events, maxAttempts }),
		onSuccess: (result) => {
			setSecret(result.secret);
			setUrl("");
			setDescription("");
			setError(null);
			setDialogOpen(false);
			invalidate();
		},
		onError: (e: Error) => setError(e.message),
	});

	const toggle = useMutation({
		mutationFn: (hook: Webhook) => updateWebhook(hook.id, { enabled: !hook.enabled }),
		onSuccess: invalidate,
	});

	const remove = useMutation({ mutationFn: deleteWebhook, onSuccess: invalidate });

	const runTest = useMutation({
		mutationFn: testWebhook,
		onSuccess: (result, id) => {
			setTestResult((prev) => ({ ...prev, [id]: result.status }));
			invalidate();
		},
		onError: (e: Error, id) => setTestResult((prev) => ({ ...prev, [id]: e.message })),
	});

	function toggleEvent(event: WebhookEvent) {
		setEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]));
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">{t("admin.webhooks.title")}</h1>
					<p className="mt-1 text-sm text-neutral-500">
						{t("admin.webhooks.description")}
					</p>
				</div>
				<Button
					onClick={() => {
						setError(null);
						setDialogOpen(true);
					}}
				>
					<Plus className="h-4 w-4" /> {t("admin.webhooks.addEndpoint")}
				</Button>
			</div>

			{secret && (
				<Card>
					<CardContent className="pt-6 text-sm">
						<p className="font-medium">{t("admin.webhooks.secretTitle")}</p>
						<p className="mt-1 text-neutral-500">
							{t("admin.webhooks.secretDescription")}
						</p>
						<code className="mt-2 block break-all rounded-lg bg-neutral-100 p-2 text-xs">
							{secret}
						</code>
						<Button variant="outline" size="sm" className="mt-3" onClick={() => setSecret(null)}>
							{t("admin.webhooks.dismiss")}
						</Button>
					</CardContent>
				</Card>
			)}

			{webhooks.isLoading ? (
				<SectionRowSkeleton />
			) : !webhooks.data?.length ? (
				<Card>
					<CardContent className="pt-6 text-sm text-neutral-500">
						{t("admin.webhooks.empty")}
					</CardContent>
				</Card>
			) : (
				<section className="divide-y divide-neutral-100 overflow-hidden rounded-3xl bg-white">
					{webhooks.data.map((hook) => (
						<div key={hook.id} className="px-5 py-6 sm:px-6">
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div className="min-w-0 flex-1">
									<h2 className="truncate text-base font-semibold text-neutral-900">{hook.url}</h2>
									{hook.description && (
										<p className="mt-1 text-sm text-neutral-500">{hook.description}</p>
									)}
									<div className="mt-3 flex flex-wrap gap-1.5">
										{hook.events.map((event) => (
											<Badge key={event} variant="secondary">
												{event}
											</Badge>
										))}
									</div>
								</div>
								<div className="flex items-center gap-2 rounded-full">
									<span className="text-xs font-medium text-neutral-600">{hook.enabled ? t("admin.webhooks.enabled") : t("admin.webhooks.disabled")}</span>
									<Switch
										checked={hook.enabled}
										onCheckedChange={() => toggle.mutate(hook)}
										aria-label={t("admin.webhooks.toggleAria", { action: hook.enabled ? t("admin.webhooks.disable") : t("admin.webhooks.enable"), url: hook.url })}
									/>
								</div>
							</div>
							<div className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl bg-neutral-50 sm:grid-cols-5">
								<div className="px-4 py-3">
									<span className="block text-lg font-semibold text-neutral-900">{hook.stats.total}</span>
									<span className="block text-xs text-neutral-500">{t("admin.webhooks.statDeliveries")}</span>
								</div>
								<div className="px-4 py-3">
									<span className={`block text-lg font-semibold ${hook.stats.delivered ? "text-green-600" : "text-neutral-400"}`}>
										{hook.stats.delivered}
									</span>
									<span className="block text-xs text-neutral-500">{t("admin.webhooks.statDelivered")}</span>
								</div>
								<div className="px-4 py-3">
									<span className={`block text-lg font-semibold ${hook.stats.pending ? "text-amber-600" : "text-neutral-400"}`}>
										{hook.stats.pending}
									</span>
									<span className="block text-xs text-neutral-500">{t("admin.webhooks.statInFlight")}</span>
								</div>
								<div className="px-4 py-3">
									<span className={`block text-lg font-semibold ${hook.stats.failing ? "text-red-600" : "text-neutral-400"}`}>
										{hook.stats.failing}
									</span>
									<span className="block text-xs text-neutral-500">{t("admin.webhooks.statFailed")}</span>
								</div>
								<div className="px-4 py-3">
									<span className="block text-lg font-semibold text-neutral-500">{hook.maxAttempts}</span>
									<span className="block text-xs text-neutral-500">{t("admin.webhooks.statMaxAttempts")}</span>
								</div>
							</div>

							<div className="mt-4 flex flex-wrap items-center gap-3">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setExpanded(expanded === hook.id ? null : hook.id)}
								>
									<Activity className="h-4 w-4" />
									{expanded === hook.id ? t("admin.webhooks.hideHistory") : t("admin.webhooks.showHistory")}
								</Button>
								<div className="ml-auto flex flex-wrap items-center gap-2">
									{testResult[hook.id] && (
										<p className="mr-1 text-sm text-neutral-600">
											{t("admin.webhooks.testDelivery", { status: testResult[hook.id] })}
										</p>
									)}
									<Button
										variant="ghost"
										size="sm"
										onClick={() => runTest.mutate(hook.id)}
										disabled={runTest.isPending}
									>
										<Send className="h-4 w-4" /> {t("admin.webhooks.test")}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => remove.mutate(hook.id)}
										aria-label={t("admin.webhooks.deleteAria", { url: hook.url })}
									>
										<Trash2 className="h-4 w-4" /> {t("admin.webhooks.delete")}
									</Button>
								</div>
							</div>

							{expanded === hook.id && (
								<div className="mt-4">
									<WebhookDeliveries webhookId={hook.id} />
								</div>
							)}
						</div>
					))}
				</section>
			)}

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("admin.webhooks.dialogTitle")}</DialogTitle>
						<DialogDescription>
							{t("admin.webhooks.dialogDescription")}
						</DialogDescription>
					</DialogHeader>
					<form
						className="space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							create.mutate();
						}}
					>
						<div className="space-y-2">
							<Label htmlFor="hook-url">{t("admin.webhooks.endpointUrl")}</Label>
							<Input
								id="hook-url"
								type="url"
								required
								value={url}
								onChange={(e) => setUrl(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="hook-description">{t("admin.webhooks.endpointDescription")}</Label>
							<Input
								id="hook-description"
								value={description}
								placeholder={t("admin.webhooks.optional")}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("admin.webhooks.events")}</Label>
							{WEBHOOK_EVENTS.map((event) => {
								const eventLabel =
									event.value === "message.inbound"
										? t("admin.webhooks.eventInbound")
										: event.value === "message.outbound"
											? t("admin.webhooks.eventOutbound")
											: t("admin.webhooks.eventFailed");
								const eventHint =
									event.value === "message.inbound"
										? t("admin.webhooks.eventInboundHint")
										: event.value === "message.outbound"
											? t("admin.webhooks.eventOutboundHint")
											: t("admin.webhooks.eventFailedHint");
								return (
									<label
										key={event.value}
										className="flex cursor-pointer items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
									>
										<span>
											<span className="block text-sm font-medium">{eventLabel}</span>
											<span className="block text-xs text-neutral-500">{eventHint}</span>
										</span>
										<input
											type="checkbox"
											className="h-4 w-4"
											checked={events.includes(event.value)}
											onChange={() => toggleEvent(event.value)}
										/>
									</label>
								);
							})}
						</div>
						<div className="space-y-2">
							<Label htmlFor="hook-attempts">{t("admin.webhooks.maxAttempts")}</Label>
							<Input
								id="hook-attempts"
								type="number"
								min={1}
								max={10}
								value={maxAttempts}
								onChange={(e) => setMaxAttempts(Number(e.target.value))}
							/>
						</div>

						{error && <p className="text-sm text-red-600">{error}</p>}

						<div className="flex justify-end gap-2">
							<Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
								{t("admin.webhooks.cancel")}
							</Button>
							<Button type="submit" disabled={create.isPending || events.length === 0}>
								<RefreshCw
									className={create.isPending ? "h-4 w-4 animate-spin" : "hidden"}
								/>
								{t("admin.webhooks.createAction")}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}

"use client";

import { Archive, Mail, MailOpen, ShieldAlert, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import type { BulkMessageAction } from "@/app/api/messages/bulk/types";
import type { BulkMessageToolbarProps } from "./types";
import { useT } from "@/lib/i18n/client";

export function BulkMessageToolbar({
	selectedCount,
	hasUnreadSelection,
	hideSelectedCount = false,
	onAction,
	onClearSelection,
	pending,
}: BulkMessageToolbarProps) {
	const { t } = useT();
	return (
		<div className="flex min-w-0 items-center gap-2 text-neutral-600 w-full">
			{!hideSelectedCount && (
				<span className="mr-2 text-sm font-medium text-neutral-800">
					{t("mail.bulk.selected", { count: selectedCount })}
				</span>
			)}
			<Tooltip label={t("mail.actions.archive")}>
				<Button variant="ghost" size="sm" onClick={() => onAction("archive")} disabled={pending} aria-label={t("mail.actions.archive")}>
					<Archive className="h-4 w-4" />
				</Button>
			</Tooltip>
			<Tooltip label={t("mail.actions.reportSpam")}>
				<Button variant="ghost" size="sm" onClick={() => onAction("spam")} disabled={pending} aria-label={t("mail.actions.reportSpam")}>
					<ShieldAlert className="h-4 w-4" />
				</Button>
			</Tooltip>
			<Tooltip label={t("mail.actions.delete")}>
				<Button variant="ghost" size="sm" onClick={() => onAction("trash")} disabled={pending} aria-label={t("mail.actions.delete")}>
					<Trash2 className="h-4 w-4" />
				</Button>
			</Tooltip>
			<Tooltip label={hasUnreadSelection ? t("mail.actions.markRead") : t("mail.actions.markUnread")}>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onAction(hasUnreadSelection ? "read" : "unread")}
					disabled={pending}
					aria-label={hasUnreadSelection ? t("mail.actions.markRead") : t("mail.actions.markUnread")}
				>
					{hasUnreadSelection ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
				</Button>
			</Tooltip>
			<span className="flex-1" />
			<Tooltip label={t("mail.bulk.moveSelected")}>
					<Select
						className="bg-white text-xs font-medium py-2 text-neutral-700 outline-none"
						disabled={pending}
						defaultValue=""
						aria-label={t("mail.bulk.moveSelected")}
						onChange={(event) => {
							if (!event.target.value) return;
							onAction(event.target.value as BulkMessageAction);
							event.target.value = "";
						}}
					>
						<option value="">{t("mail.bulk.moveTo")}</option>
						<option value="archive">{t("mail.folders.archived")}</option>
						<option value="spam">{t("mail.folders.spam")}</option>
						<option value="trash">{t("mail.folders.trash")}</option>
					</Select>
			</Tooltip>
			<Tooltip label={t("mail.bulk.clearSelection")}>
				<Button variant="ghost" size="sm" onClick={onClearSelection} disabled={pending} aria-label={t("mail.bulk.clearSelection")}>
					<X className="h-4 w-4" />
				</Button>
			</Tooltip>
		</div>
	);
}

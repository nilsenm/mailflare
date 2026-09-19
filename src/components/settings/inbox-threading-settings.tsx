"use client";

import { Switch } from "@/components/ui/switch";
import { useConversationView } from "@/components/messages/use-conversation-view";
import { useLatestMessagesFirst } from "@/components/messages/use-latest-messages-first";
import { useT } from "@/lib/i18n/client";

export function InboxThreadingSettings() {
	const { t } = useT();
	const [conversationView, setConversationView] = useConversationView();
	const [latestMessagesFirst, setLatestMessagesFirst] = useLatestMessagesFirst();

	return (
		<div className="space-y-3">
			<label className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4">
				<span className="flex-1">
					<span className="block text-sm font-medium text-neutral-900">{t("settings.threading.groupTitle")}</span>
					<span className="mt-1 block text-sm text-neutral-500">
						{t("settings.threading.groupDescription")}
					</span>
				</span>
				<Switch checked={conversationView} onCheckedChange={setConversationView} />
			</label>
			<label className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4">
				<span className="flex-1">
					<span className="block text-sm font-medium text-neutral-900">{t("settings.threading.sortLatestTitle")}</span>
					<span className="mt-1 block text-sm text-neutral-500">
						{t("settings.threading.sortLatestDescription")}
					</span>
				</span>
				<Switch checked={latestMessagesFirst} onCheckedChange={setLatestMessagesFirst} />
			</label>
		</div>
	);
}

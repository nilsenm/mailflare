import { InboxThreadingSettings } from "@/components/settings/inbox-threading-settings";
import { InboxShortcutsSettings } from "@/components/settings/inbox-shortcuts-settings";
import { MailboxAutoReplyForm } from "@/components/settings/mailbox-auto-reply-form";
import { SpamFilterSettings } from "@/components/settings/spam-filter-settings";
import { getDictionary, translate } from "@/lib/i18n";
import { getServerLang } from "@/lib/i18n/server";

export default async function SettingsInboxPage() {
	const dict = getDictionary(await getServerLang());
	const t = (key: Parameters<typeof translate>[1]) => translate(dict, key);
	return (
		<div className="space-y-8 py-4">
			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">{t("settings.inbox.spamProtection")}</h2>
					<p className="mt-1 text-sm text-neutral-500">{t("settings.inbox.spamProtectionDescription")}</p>
				</div>
				<div className="rounded-3xl bg-white p-6">
					<SpamFilterSettings />
				</div>
			</section>
			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">{t("settings.inbox.threading")}</h2>
					<p className="mt-1 text-sm text-neutral-500">{t("settings.inbox.threadingDescription")}</p>
				</div>
				<div className="rounded-3xl bg-white p-6">
					<InboxThreadingSettings />
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">{t("settings.inbox.shortcuts")}</h2>
					<p className="mt-1 text-sm text-neutral-500">{t("settings.inbox.shortcutsDescription")}</p>
				</div>
				<div className="rounded-3xl bg-white p-6">
					<InboxShortcutsSettings />
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">{t("settings.inbox.autoReply")}</h2>
					<p className="mt-1 text-sm text-neutral-500">
						{t("settings.inbox.autoReplyDescription")}
					</p>
				</div>
				<div className="rounded-3xl bg-white p-6">
					<MailboxAutoReplyForm />
				</div>
			</section>
		</div>
	);
}

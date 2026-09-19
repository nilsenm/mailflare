import { InboxRules } from "@/components/settings/inbox-rules";
import { DomainRouting } from "@/components/settings/domain-routing/domain-routing";
import { getDictionary, translate } from "@/lib/i18n";
import { getServerLang } from "@/lib/i18n/server";

export default async function SettingsRulesPage() {
	const dict = getDictionary(await getServerLang());
	const t = (key: Parameters<typeof translate>[1]) => translate(dict, key);
	return (
		<div className="space-y-8">
			{/* <div>
				<h1 className="text-3xl font-medium text-neutral-900">{t("settings.rules.title")}</h1>
				<p className="mt-1 text-sm text-neutral-500">
					{t("settings.rules.description")}
				</p>
			</div> */}
			<div>
				<DomainRouting />
			</div>
			<div className="py-6">
				<InboxRules />
			</div>
		</div>
	);
}

"use client";

import { ComposeForm } from "@/components/compose/compose-form";
import { useT } from "@/lib/i18n/client";

export default function ComposePage() {
	const { t } = useT();
	return (
		<div className="h-full overflow-auto p-8">
			<div className="mb-6">
				<h1 className="text-2xl font-normal text-neutral-900">{t("compose.page.title")}</h1>
				<p className="mt-1 text-sm text-neutral-500">{t("compose.page.description")}</p>
			</div>
			<ComposeForm mode="page" />
		</div>
	);
}

"use client";

import { useT } from "@/lib/i18n/client";

export function RouteLoadingBar() {
	const { t } = useT();
	return (
		<div className="fixed inset-x-0 top-0 z-[120] h-1 overflow-hidden bg-blue-100" role="progressbar" aria-label={t("mail.loadingPage")}>
			<div className="route-loading-bar h-full w-2/5 bg-blue-600" />
		</div>
	);
}

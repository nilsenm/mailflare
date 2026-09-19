"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logoutClientSession } from "@/lib/auth/logout";
import { useT } from "@/lib/i18n/client";

export function LogoutButton() {
	const { t } = useT();
	const router = useRouter();
	return (
		<Button
			variant="outline"
			className="w-full"
			onClick={async () => {
				await logoutClientSession();
				router.replace("/login");
				router.refresh();
			}}
		>
			{t("mail.navigation.logOut")}
		</Button>
	);
}

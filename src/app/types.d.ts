import type { LucideIcon } from "lucide-react";
import type { ButtonProps } from "@/components/ui/button";
import type { TranslationKey } from "@/lib/i18n";

export type HomeAction = {
	href: string;
	labelKey: TranslationKey;
	variant: ButtonProps["variant"];
};

export type LandingNavItem = {
	href: string;
	label: string;
};

export type SidebarItem = {
	labelKey: TranslationKey;
	icon: LucideIcon;
	active?: boolean;
	count?: string;
};

export type MailPreview = {
	icon: LucideIcon;
	sender: string;
	subjectKey: TranslationKey;
	previewKey: TranslationKey;
	badgeKey: TranslationKey;
};

export type LandingStat = {
	value: string;
	label: string;
};

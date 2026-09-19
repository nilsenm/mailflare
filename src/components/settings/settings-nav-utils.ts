import type { SettingsNavSection } from "./settings-nav-types";

export const settingsNavSections: SettingsNavSection[] = [
	{
		labelKey: "settings.nav.settings",
		items: [
			{
				href: "/settings/account",
				labelKey: "settings.nav.account",
			},
			{
				href: "/settings/inbox",
				labelKey: "settings.nav.inbox",
			},
			{
				href: "/settings/rules",
				labelKey: "settings.nav.rulesRouting",
			},
		],
	},
	{
		labelKey: "settings.nav.mailbox",
		items: [
			{
				href: "/settings/import",
				labelKey: "settings.nav.import",
			},
			{
				href: "/settings/export",
				labelKey: "settings.nav.export",
			},
		],
	},
];

export function isActiveSettingsPath(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(`${href}/`);
}

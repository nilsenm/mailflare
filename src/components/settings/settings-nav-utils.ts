import type { SettingsNavSection } from "./settings-nav-types";

export const settingsNavSections: SettingsNavSection[] = [
	{
		label: "Settings",
		items: [
			{
				href: "/settings/account",
				label: "Cuenta",
			},
			{
				href: "/settings/inbox",
				label: "Inbox",
			},
			{
				href: "/settings/rules",
				label: "Rules & Routing",
			},
		],
	},
	{
		label: "Buzón",
		items: [
			{
				href: "/settings/import",
				label: "Import",
			},
			{
				href: "/settings/export",
				label: "Export",
			},
		],
	},
];

export function isActiveSettingsPath(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(`${href}/`);
}

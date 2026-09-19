import { FileText, Inbox, MailCheck, Send, ShieldAlert, Trash2 } from "lucide-react";
import type { HomeAction, LandingNavItem, LandingStat, MailPreview, SidebarItem } from "./types";

export const landingNavItems: LandingNavItem[] = [
	{ href: "#workflow", label: "Workflow" },
	{ href: "#domains", label: "Domains" },
	{ href: "#api", label: "API" },
];

export const sidebarItems: SidebarItem[] = [
	{ labelKey: "nav.inbox", icon: Inbox, active: true, count: "18" },
	{ labelKey: "nav.sent", icon: Send },
	{ labelKey: "nav.drafts", icon: FileText, count: "4" },
	{ labelKey: "nav.spam", icon: ShieldAlert },
	{ labelKey: "nav.trash", icon: Trash2 },
];

export const heroMessages: MailPreview[] = [
	{
		icon: MailCheck,
		sender: "postmaster@northline.dev",
		subjectKey: "settings.ui.landing.mail1Subject",
		previewKey: "settings.ui.landing.mail1Preview",
		badgeKey: "settings.ui.landing.mail1Badge",
	},
	{
		icon: MailCheck,
		sender: "ops@halcyon.tools",
		subjectKey: "settings.ui.landing.mail2Subject",
		previewKey: "settings.ui.landing.mail2Preview",
		badgeKey: "settings.ui.landing.mail2Badge",
	},
	{
		icon: MailCheck,
		sender: "alerts@marketmesh.io",
		subjectKey: "settings.ui.landing.mail3Subject",
		previewKey: "settings.ui.landing.mail3Preview",
		badgeKey: "settings.ui.landing.mail3Badge",
	},
	{
		icon: MailCheck,
		sender: "admin@mailflare.dev",
		subjectKey: "settings.ui.landing.mail4Subject",
		previewKey: "settings.ui.landing.mail4Preview",
		badgeKey: "settings.ui.landing.mail4Badge",
	},
];

export const inboxStats: LandingStat[] = [
	{ value: "24ms", label: "routing rule lookup" },
	{ value: "7", label: "active domains" },
	{ value: "1.8k", label: "messages tracked this week" },
];

export const deliverySignals = [
	"DNS setup status before mail starts moving",
	"Mailbox-first routing for support and product teams",
	"API keys and webhooks managed beside the inbox",
];

export function getHomeActions(isLoggedIn: boolean): HomeAction[] {
	if (isLoggedIn) {
		return [{ href: "/inbox", labelKey: "settings.ui.landing.headerDashboard", variant: "default" }];
	}

	return [
		{ href: "/login", labelKey: "settings.ui.landing.logIn", variant: "outline" },
		{ href: "/setup", labelKey: "settings.ui.landing.createAccount", variant: "default" },
	];
}

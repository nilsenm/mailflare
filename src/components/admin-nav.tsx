"use client";

import {
  DatabaseBackup,
  Globe2,
  Activity,
  Mail,
  Settings,
  Palette,
  Users,
  Route,
  Webhook,
} from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { NavItem } from "./components-nav";
import { SidebarFooter } from "./sidebar-footer";
import { useBranding } from "./branding-provider";
import { SidebarHeader } from "./sidebar-header";
import { useSidebar } from "./sidebar-state";

export function AdminNav({ className }: { className?: string }) {
  const { t } = useT();
  const branding = useBranding();
  const { minimal } = useSidebar();

  const sections = [
    {
      // label: t("admin.nav.overview"),
      links: [{ href: "/admin", label: t("admin.nav.overview"), icon: Settings }],
    },
    {
      label: t("admin.nav.email"),
      links: [
        { href: "/mailboxes", label: t("admin.nav.mailboxes"), icon: Mail },
        { href: "/domains", label: t("admin.nav.domains"), icon: Globe2 },
        { href: "/routing", label: t("admin.nav.routing"), icon: Route },
        { href: "/webhooks", label: t("admin.nav.webhooks"), icon: Webhook },
      ],
    },
    {
      label: t("admin.nav.administration"),
      links: [
        { href: "/accounts", label: t("admin.nav.accounts"), icon: Users },
        { href: "/activity", label: t("admin.nav.activity"), icon: Activity },
        { href: "/backups", label: t("admin.nav.backups"), icon: DatabaseBackup },
      ],
    },
    {
      label: t("admin.nav.product"),
      links: [
        { href: "/branding", label: t("admin.nav.branding"), icon: Palette },
        // { href: "/api-keys", label: t("admin.nav.apiKeys"), icon: KeyRound },
      ],
    },
  ];

  return (
    <nav className={cn("flex min-h-full flex-col gap-1", className)}>
      <SidebarHeader href="/inbox" label={t("admin.nav.admin")} />
      <div className={cn("space-y-4", minimal && "space-y-2")}>
        {sections.map((section) => {
          const links = section.links.filter(
            (link) =>
              link.href !== "/branding" || branding.canCustomizeBranding,
          );
          if (links.length === 0) return null;

          return (
            // The first section has no label, so fall back to its first href for a stable key.
            <section key={section.label ?? links[0].href}>
              {!minimal && section.label && (
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {links.map((link) => (
                  <NavItem link={link} key={link.href} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <span className="flex-1" />
      <SidebarFooter />
    </nav>
  );
}

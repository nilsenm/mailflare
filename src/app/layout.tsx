import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";
import { getDictionary, translate } from "@/lib/i18n";
import { getServerLang } from "@/lib/i18n/server";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
	const lang = await getServerLang();
	return {
		title: "Mailflare",
		description: translate(getDictionary(lang), "settings.ui.meta.description"),
		icons: { icon: "/api/branding/icon" },
	};
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const lang = await getServerLang();
	return (
		<html lang={lang}>
			<head>
				<link rel="icon" href="/api/branding/icon"></link>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased light`}>
				<Providers lang={lang} dictionary={getDictionary(lang)}>{children}</Providers>
			</body>
		</html>
	);
}

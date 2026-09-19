import type { AppDatabase } from "@/db";

// Instalación LESOTUR (fork AGPL-3.0): los buzones compartidos están siempre
// habilitados, sin depender de una licencia Team.
export async function isTeamMailboxSharingEnabled(_db: AppDatabase): Promise<boolean> {
	return true;
}

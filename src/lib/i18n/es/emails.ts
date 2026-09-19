import type { AreaDictionary } from "../en";
import type { emails as source } from "../en/emails";

export const emails = {
	"emails.passwordReset.subject": "Restablece tu contraseña de {appName}",
	"emails.passwordReset.intro": "Alguien pidió restablecer la contraseña de {email} en {appName}.",
	"emails.passwordReset.instruction": "Abre este enlace dentro de {minutes} minutos para elegir una contraseña nueva:",
	"emails.passwordReset.ignore": "Si no fuiste tú, puedes ignorar este mensaje; la contraseña se mantiene igual.",
} satisfies AreaDictionary<typeof source>;

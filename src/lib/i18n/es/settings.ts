import type { AreaDictionary } from "../en";
import type { settings as source } from "../en/settings";

export const settings = {
	"settings.accountDetails": "Detalles de la cuenta",
	"settings.accountDescription": "Administra tu identidad, opciones de recuperación y preferencias de correo.",
	"settings.forwardingEmail": "Reenvío de correo",
	"settings.forwardingDescription": "Envía una copia de los mensajes entrantes a otra dirección de correo.",
	"settings.emailSignature": "Firma de correo",
	"settings.signatureDescription": "Configura la firma del buzón seleccionado arriba.",
	"settings.security": "Seguridad",
	"settings.securityDescription": "Administra cómo inicias sesión en tu cuenta.",
	"settings.changePassword": "Cambiar contraseña",
	"settings.passwordDescription": "Usa al menos 8 caracteres para tu nueva contraseña.",
	"settings.mfaDescription": "Solicita un código de una aplicación de autenticación al iniciar sesión.",
	"settings.emailApps": "Aplicaciones de correo",
	"settings.emailAppsDescription": "Usa tu correo desde una aplicación de escritorio o móvil mediante JMAP.",
	"settings.languageTitle": "Idioma",
	"settings.languageDescription": "Elige el idioma que usa Mailflare.",
} satisfies AreaDictionary<typeof source>;

import type { AreaDictionary } from "../en";
import type { core as source } from "../en/core";

export const core = {
	"common.loading": "Cargando…",
	"common.save": "Guardar",
	"common.cancel": "Cancelar",
	"common.delete": "Eliminar",
	"common.edit": "Editar",
	"common.email": "Correo electrónico",
	"common.language": "Idioma",
	"common.english": "Inglés",
	"common.spanish": "Español",
	"nav.inbox": "Bandeja de entrada",
	"nav.sent": "Enviados",
	"nav.drafts": "Borradores",
	"nav.trash": "Papelera",
	"nav.spam": "Spam",
	"nav.archive": "Archivo",
	"nav.starred": "Destacados",
	"nav.snoozed": "Pospuestos",
	"nav.compose": "Redactar",
	"nav.contacts": "Contactos",
	"nav.calendar": "Calendario",
	"nav.settings": "Ajustes",
	"nav.signOut": "Cerrar sesión",
	"errors.loadAccount": "No se pudo cargar la cuenta",
	"email.messageCount": { one: "{count} mensaje", other: "{count} mensajes" },
} satisfies AreaDictionary<typeof source>;

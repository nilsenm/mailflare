import { core } from "./en/core";
import { auth } from "./en/auth";
import { settings } from "./en/settings";
import { mail } from "./en/mail";
import { compose } from "./en/compose";
import { admin } from "./en/admin";
import { server } from "./en/server";

// Diccionario fuente (inglés). Cada área vive en su propio archivo en ./en/<area>.ts
// y su traducción en ./es/<area>.ts con exactamente las mismas claves.
export const en = {
	...core,
	...auth,
	...settings,
	...mail,
	...compose,
	...admin,
	...server,
} as const;

export type AreaDictionary<T> = {
	[K in keyof T]: T[K] extends string ? string : { one: string; other: string };
};

export type Dictionary = AreaDictionary<typeof en>;

export type TranslationKey = keyof Dictionary;

import type { Dictionary } from "./en";
import { core } from "./es/core";
import { auth } from "./es/auth";
import { settings } from "./es/settings";
import { mail } from "./es/mail";
import { compose } from "./es/compose";
import { admin } from "./es/admin";
import { server } from "./es/server";
import { emails } from "./es/emails";

export const es = {
	...core,
	...auth,
	...settings,
	...mail,
	...compose,
	...admin,
	...server,
	...emails,
} satisfies Dictionary;

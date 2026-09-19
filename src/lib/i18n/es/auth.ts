import type { AreaDictionary } from "../en";
import type { auth as source } from "../en/auth";

export const auth = {
	"auth.signIn": "Iniciar sesión",
	"auth.signingIn": "Iniciando sesión…",
	"auth.password": "Contraseña",
	"auth.forgotPassword": "¿Olvidaste tu contraseña?",
	"auth.backToSignIn": "Volver a iniciar sesión",
	"auth.loginDescription": "Abre tu buzón y continúa desde el mismo espacio de la bandeja de entrada.",
	"auth.loginFailed": "No se pudo iniciar sesión",
	"auth.loginTimeout": "El inicio de sesión agotó el tiempo de espera. Inténtalo de nuevo.",
	"auth.loginUnavailable": "No se pudo conectar con el servicio de inicio de sesión. Inténtalo de nuevo.",
	"auth.mfaTitle": "Autenticación de dos factores",
	"auth.mfaDescription": "Ingresa el código de 6 dígitos de tu aplicación de autenticación o uno de tus códigos de recuperación.",
	"auth.code": "Código",
	"auth.verify": "Verificar",
	"auth.verifying": "Verificando…",
	"auth.codeMismatch": "Ese código no coincide",
} satisfies AreaDictionary<typeof source>;

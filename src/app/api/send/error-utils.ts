export function getSendErrorStatus(message: string): number {
	if (message === "El buzón es obligatorio") return 400;
	if (
		message === "Buzón no encontrado" ||
		message === "Sender account not found" ||
		message === "You do not have permission to send from this mailbox" ||
		message === "Sender address does not match the selected mailbox"
	) {
		return 403;
	}
	return 500;
}

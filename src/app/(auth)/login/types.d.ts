export type LoginResult = {
	token?: string;
	redirect?: string;
	error?: string;
	/** Stable error code, independent of the UI language (e.g. "challenge_expired"). */
	code?: string;
	/** Password accepted; a code from the authenticator is still needed. */
	mfaRequired?: boolean;
	challengeToken?: string;
};

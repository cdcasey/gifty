import { Resend } from "resend";

interface EnvWithResend {
	RESEND_API_KEY: string;
}

export async function sendMagicLinkEmail(
	env: EnvWithResend,
	email: string,
	token: string,
	baseUrl: string,
) {
	const resend = new Resend(env.RESEND_API_KEY);

	const magicLink = `${baseUrl}/auth/verify?token=${token}`;

	const { error } = await resend.emails.send({
		from: "The Gifting Book <onboarding@resend.dev>",
		to: email,
		subject: "Your login link",
		html: `
			<h1>Welcome to The Gifting Book</h1>
			<p>Click the link below to sign in:</p>
			<p><a href="${magicLink}">Sign in to The Gifting Book</a></p>
			<p>This link expires in 15 minutes.</p>
			<p>If you didn't request this, you can ignore this email.</p>
		`,
	});

	if (error) {
		throw new Error(`Failed to send email: ${error.message}`);
	}
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { requestMagicLink } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const [email, setEmail] = useState("");
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			await requestMagicLink({ data: { email } });
			setSent(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	if (sent) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="w-full max-w-md space-y-4 p-8 text-center">
					<h1 className="text-2xl font-bold">Check your email</h1>
					<p className="text-muted-foreground">We sent a login link to {email}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md space-y-4 p-8">
				<h1 className="text-center text-2xl font-bold">Sign in</h1>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						type="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
					{error && <p className="text-sm text-red-500">{error}</p>}
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Sending..." : "Send login link"}
					</Button>
				</form>
			</div>
		</div>
	);
}

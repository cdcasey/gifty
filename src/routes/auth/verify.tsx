import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { verifyMagicLink } from "@/lib/auth";

export const Route = createFileRoute("/auth/verify")({
	validateSearch: (search: Record<string, unknown>) => ({
		token: (search.token as string) || "",
	}),
	component: VerifyPage,
});

function VerifyPage() {
	const { token } = Route.useSearch();
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!token) {
			setError("Missing token");
			return;
		}

		verifyMagicLink({ data: { token } })
			.then(() => {
				navigate({ to: "/" });
			})
			.catch((err) => {
				setError(err instanceof Error ? err.message : "Verification failed");
			});
	}, [token, navigate]);

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="w-full max-w-md space-y-4 p-8 text-center">
					<h1 className="text-2xl font-bold text-red-500">Error</h1>
					<p>{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<p>Verifying...</p>
		</div>
	);
}

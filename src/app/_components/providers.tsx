"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/app/_components/theme";
import { initAnalytics } from "~/lib/posthog";

/**
 * Client-side providers. SessionProvider is outer so auth state is
 * available everywhere; sign-in is optional — the app works logged out.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);
  return (
    <SessionProvider>
      <TRPCReactProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </TRPCReactProvider>
    </SessionProvider>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/psk/AppShell";
import { PagePlaceholder } from "@/components/psk/PagePlaceholder";

export const Route = createFileRoute("/live-casino")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://feg.ifelseai.com/live-casino" }],
    meta: [
      { title: "PSK Intelligence — live casino" },
      { name: "description", content: "PSK Intelligence prototype: live casino section shell." },
      { property: "og:title", content: "PSK Intelligence — live casino" },
      { property: "og:description", content: "PSK Intelligence prototype: live casino section shell." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PagePlaceholder
        title="Live Casino"
        note="This section of the PSK Intelligence prototype shell is ready for content."
      />
    </AppShell>
  );
}

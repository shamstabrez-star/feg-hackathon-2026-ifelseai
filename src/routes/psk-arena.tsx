import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/psk/AppShell";
import { PagePlaceholder } from "@/components/psk/PagePlaceholder";

export const Route = createFileRoute("/psk-arena")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://feg.ifelseai.com/psk-arena" }],
    meta: [
      { title: "PSK Intelligence — psk arena" },
      { name: "description", content: "PSK Intelligence prototype: psk arena section shell." },
      { property: "og:title", content: "PSK Intelligence — psk arena" },
      { property: "og:description", content: "PSK Intelligence prototype: psk arena section shell." },
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
        title="PSK Arena"
        note="This section of the PSK Intelligence prototype shell is ready for content."
      />
    </AppShell>
  );
}

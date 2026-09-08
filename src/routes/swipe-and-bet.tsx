import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/psk/AppShell";
import { PagePlaceholder } from "@/components/psk/PagePlaceholder";

export const Route = createFileRoute("/swipe-and-bet")({
  head: () => ({
    meta: [
      { title: "PSK Intelligence — swipe and bet" },
      { name: "description", content: "PSK Intelligence prototype: swipe and bet section shell." },
      { property: "og:title", content: "PSK Intelligence — swipe and bet" },
      { property: "og:description", content: "PSK Intelligence prototype: swipe and bet section shell." },
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
        title="swipe and bet"
        note="This section of the PSK Intelligence prototype shell is ready for content."
      />
    </AppShell>
  );
}

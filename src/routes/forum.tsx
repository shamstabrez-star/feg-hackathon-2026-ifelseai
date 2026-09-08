import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/psk/AppShell";
import { PagePlaceholder } from "@/components/psk/PagePlaceholder";

export const Route = createFileRoute("/forum")({
  head: () => ({
    meta: [
      { title: "PSK Intelligence — forum" },
      { name: "description", content: "PSK Intelligence prototype: forum section shell." },
      { property: "og:title", content: "PSK Intelligence — forum" },
      { property: "og:description", content: "PSK Intelligence prototype: forum section shell." },
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
        title="Forum"
        note="This section of the PSK Intelligence prototype shell is ready for content."
      />
    </AppShell>
  );
}

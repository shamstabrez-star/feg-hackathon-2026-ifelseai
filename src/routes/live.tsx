import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/psk/AppShell";
import { PagePlaceholder } from "@/components/psk/PagePlaceholder";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "PSK Intelligence — live" },
      { name: "description", content: "PSK Intelligence prototype: live section shell." },
      { property: "og:title", content: "PSK Intelligence — live" },
      { property: "og:description", content: "PSK Intelligence prototype: live section shell." },
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
        title="Live"
        note="This section of the PSK Intelligence prototype shell is ready for content."
      />
    </AppShell>
  );
}

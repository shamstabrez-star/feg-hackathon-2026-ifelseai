import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/psk/AppShell";
import { PagePlaceholder } from "@/components/psk/PagePlaceholder";

export const Route = createFileRoute("/promo")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://feg.ifelseai.com/promo" }],
    meta: [
      { title: "PSK Intelligence — promo" },
      { name: "description", content: "PSK Intelligence prototype: promo section shell." },
      { property: "og:title", content: "PSK Intelligence — promo" },
      { property: "og:description", content: "PSK Intelligence prototype: promo section shell." },
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
        title="Promo"
        note="This section of the PSK Intelligence prototype shell is ready for content."
      />
    </AppShell>
  );
}

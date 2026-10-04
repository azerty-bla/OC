import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://oteria-conseil.fr",
  base: "/",
  trailingSlash: "always",
  server: { port: 4325 },
  integrations: [
    sitemap({
      // Exclure les pages légales du sitemap (non pertinentes pour le crawl SEO)
      filter: (page) =>
        !page.includes("/mentions-legales/") &&
        !page.includes("/politique-confidentialite/"),
      changefreq: "weekly",
      priority: 0.7,
      serialize(item) {
        // Homepage → priorité max
        if (item.url === "https://oteria-conseil.fr/") {
          item.priority = 1.0;
        }
        // Pages de conversion (BOFU) → priorité élevée
        if (
          item.url.includes("/diagnostic-gratuit/") ||
          item.url.includes("/contact-installateur/")
        ) {
          item.priority = 0.9;
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

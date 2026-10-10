import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { getPageDates } from "./src/lib/pageDates.mjs";

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
        // lastmod = date réelle de la dernière modification de la page (git), pas la date de build
        const dates = getPageDates(item.url);
        if (dates) item.lastmod = dates.modified;
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

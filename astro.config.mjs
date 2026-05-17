import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://oteria-conseil.fr",
  trailingSlash: "always",
  server: { port: 4325 },
  vite: {
    plugins: [tailwindcss()],
  },
});

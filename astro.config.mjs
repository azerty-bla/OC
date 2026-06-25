import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://azerty-bla.github.io",
  base: "/OC",
  trailingSlash: "always",
  server: { port: 4325 },
  vite: {
    plugins: [tailwindcss()],
  },
});

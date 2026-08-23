import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Recipe Collector • Culinary Studio & Planner",
    short_name: "Recipe Collector",
    description: "A distraction-free studio for recipes, smart meal planning, and everyday cooking.",
    start_url: "/",
    display: "standalone",
    background_color: "#110d0b",
    theme_color: "#f59e0b",
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/app-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}

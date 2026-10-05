import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Culineer • Your Culinary Co-pilot",
    short_name: "Culineer",
    description: "Your everyday culinary co-pilot for saving recipes, smart meal planning, and distraction-free cooking.",
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
    share_target: {
      action: "/import",
      method: "GET",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SpinZone",
    short_name: "SpinZone",
    description: "Entrenamiento de spinning guiado por frecuencia cardiaca.",
    start_url: "/",
    display: "standalone",
    background_color: "#080a09",
    theme_color: "#b7ff30",
    orientation: "any",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}

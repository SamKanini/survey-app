import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/geoserver": {
        target: "http://localhost:8080", // Replace with your GeoServer URL
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
});

import babel from "@rolldown/plugin-babel";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({
      plugins: ["babel-plugin-react-compiler"],
    }),
  ],
  base: "/BirdsEyeV3",
  build: {
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "firebase",
              test: /node_modules\/firebase/,
            },
            {
              name: "react-select",
              test: /node_modules\/react-select/,
            },
          ],
        },
      },
    },
  },
});

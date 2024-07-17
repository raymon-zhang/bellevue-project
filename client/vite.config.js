import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    esbuild: {
        jsxFactory: "h",
        jsxFragment: "Fragment",
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                login: resolve(__dirname, "login/index.html"),
            },
        },
    },
});

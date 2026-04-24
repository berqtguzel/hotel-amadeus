import "./bootstrap";
import "../css/app.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { ThemeProvider } from "./Context/ThemeContext";
import { I18nProvider } from "./i18n";
import PageTransitionLoader from "./Components/PageTransitionLoader";

createInertiaApp({
    title: (title) => title || "Hotel Amadeus",

    resolve: (name) => {
        const pages = import.meta.glob("./Pages/**/*.{jsx,tsx}", {
            eager: true,
        });

        const keyJsx = `./Pages/${name}.jsx`;
        const keyTsx = `./Pages/${name}.tsx`;
        const page = pages[keyJsx] || pages[keyTsx];

        if (!page) {
            console.error("Inertia page keys:", Object.keys(pages));
            throw new Error(`Page not found: ${keyJsx} (or ${keyTsx})`);
        }
        return page;
    },

    setup({ el, App, props }) {
        const initialLocale =
            props?.initialPage?.props?.locale ??
            props?.initialPage?.props?.global?.locale ??
            "de";
        const root = createRoot(el);
        root.render(
            <I18nProvider initialLocale={initialLocale}>
                <ThemeProvider>
                    <>
                        <PageTransitionLoader />
                        <App {...props} />
                    </>
                </ThemeProvider>
            </I18nProvider>,
        );
    },

    progress: false,
});

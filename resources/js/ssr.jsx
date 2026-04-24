import { createInertiaApp } from "@inertiajs/react";
import createServer from "@inertiajs/react/server";
import { renderToString } from "react-dom/server";
import pretty from "pretty";

createServer((page) =>
    createInertiaApp({
        page,
        render: (html) => {
            const rendered = renderToString(html);
            return pretty(rendered, { ocd: true });
        },
        resolve: (name) => {
            const pages = import.meta.glob("./Pages/**/*.{jsx,js,tsx,ts}", {
                eager: true,
            });

            // 1. Deneme: Tam eşleşme (Örn: Home/Index)
            let pageModule =
                pages[`./Pages/${name}.jsx`] || pages[`./Pages/${name}.js`];

            // 2. Deneme: Klasör ismiyle gelmişse Index'i ara (Örn: Home -> Home/Index)
            if (!pageModule) {
                pageModule =
                    pages[`./Pages/${name}/Index.jsx`] ||
                    pages[`./Pages/${name}/Index.js`];
            }

            if (!pageModule) {
                console.error("Bulunamayan Sayfa:", name);
                // Hata vermemesi için boş bir fallback yapabiliriz ama hatayı görmek daha iyidir
                throw new Error(`Page not found: ${name}`);
            }

            return pageModule.default || pageModule;
        },
        setup: ({ App, props }) => <App {...props} />,
    }),
);

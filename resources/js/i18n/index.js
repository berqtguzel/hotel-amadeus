import { createElement, createContext, useContext, useCallback, useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import de from "./de.json";
import en from "./en.json";
import tr from "./tr.json";

const translations = { de, en, tr };

const I18nContext = createContext({ t: (k) => k, locale: "de" });

function normalizeLocale(value) {
    const locale = String(value || "").toLowerCase();
    return ["de", "en", "tr"].includes(locale) ? locale : "de";
}

function getLocaleFromUrl() {
    if (typeof window === "undefined") return "de";
    const match = window.location.pathname.match(/^\/(de|en|tr)(\/|$)/);
    return normalizeLocale(match ? match[1] : "de");
}

export function I18nProvider({ children, initialLocale = null }) {
    const [locale, setLocale] = useState(() =>
        normalizeLocale(initialLocale || "de"),
    );

    useEffect(() => {
        if (!initialLocale) {
            setLocale(normalizeLocale(getLocaleFromUrl()));
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const off = router.on("navigate", (event) => {
            const nextLocale =
                event?.detail?.page?.props?.locale ??
                event?.detail?.page?.props?.global?.locale ??
                getLocaleFromUrl();

            setLocale(normalizeLocale(nextLocale));
        });

        return off;
    }, []);

    const dict = translations[locale] || translations.de;

    const t = useCallback(
        (key, params) => {
            let str = dict[key] ?? translations.de[key] ?? key;
            if (params) {
                Object.entries(params).forEach(([k, v]) => {
                    str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
                });
            }
            return str;
        },
        [dict],
    );

    return createElement(I18nContext.Provider, { value: { t, locale } }, children);
}
export function useTranslation() {
    return useContext(I18nContext);
}

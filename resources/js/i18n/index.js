import { createElement, createContext, useContext, useCallback, useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import bg from "./bg.json";
import cs from "./cs.json";
import de from "./de.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import hr from "./hr.json";
import it from "./it.json";
import pl from "./pl.json";
import pt from "./pt.json";
import ro from "./ro.json";
import ru from "./ru.json";
import sk from "./sk.json";
import tr from "./tr.json";

const translations = { bg, cs, de, en, es, fr, hr, it, pl, pt, ro, ru, sk, tr };
const supportedLocales = Object.keys(translations);

const I18nContext = createContext({ t: (k) => k, locale: "de" });

function normalizeLocale(value) {
    const locale = String(value || "").toLowerCase();
    return supportedLocales.includes(locale) ? locale : "de";
}

function getLocaleFromUrl() {
    if (typeof window === "undefined") return "de";
    const match = window.location.pathname.match(
        new RegExp(`^\\/(${supportedLocales.join("|")})(\\/|$)`),
    );
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

    const dict = translations[locale] || translations.en || translations.de;

    const t = useCallback(
        (key, params) => {
            let str =
                dict[key] ??
                translations.en[key] ??
                translations.de[key] ??
                key;
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

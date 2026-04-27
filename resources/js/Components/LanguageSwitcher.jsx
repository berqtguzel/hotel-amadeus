import React from "react";
import { router, usePage } from "@inertiajs/react";
import { FiCheck, FiGlobe, FiX } from "react-icons/fi";
import { useTranslation } from "@/i18n";
import "../../css/ui-widgets.css";

const FLAG_BY_LOCALE = {
    de: "\uD83C\uDDE9\uD83C\uDDEA",
    cs: "\uD83C\uDDE8\uD83C\uDDFF",
    en: "\uD83C\uDDEC\uD83C\uDDE7",
    es: "\uD83C\uDDEA\uD83C\uDDF8",
    fr: "\uD83C\uDDEB\uD83C\uDDF7",
    hr: "\uD83C\uDDED\uD83C\uDDF7",
    it: "\uD83C\uDDEE\uD83C\uDDF9",
    pl: "\uD83C\uDDF5\uD83C\uDDF1",
    pt: "\uD83C\uDDF5\uD83C\uDDF9",
    ro: "\uD83C\uDDF7\uD83C\uDDF4",
    sk: "\uD83C\uDDF8\uD83C\uDDF0",
    tr: "\uD83C\uDDF9\uD83C\uDDF7",
    bg: "\uD83C\uDDE7\uD83C\uDDEC",
    ru: "\uD83C\uDDF7\uD83C\uDDFA",
};

function toLocalePath(path, nextLocale, currentLocale, availableLanguages) {
    const cleanPath = path.split("?")[0].split("#")[0];

    const segments = cleanPath.split("/").filter(Boolean);

    // 🔥 geçerli locale listesi
    const localeSet = new Set(
        availableLanguages.map((l) => l.locale?.toLowerCase()),
    );

    // 🔥 ilk segment locale ise replace et
    if (segments.length > 0 && localeSet.has(segments[0].toLowerCase())) {
        segments[0] = nextLocale;
        return "/" + segments.join("/");
    }

    // 🔥 locale yoksa başına ekle
    return "/" + [nextLocale, ...segments].join("/");
}

function getLanguageFlag(locale) {
    return FLAG_BY_LOCALE[locale?.toLowerCase()] ?? "\uD83C\uDF10";
}

export default function LanguageSwitcher() {
    const { props } = usePage();
    const currentLocale = props?.global?.locale ?? "de";
    const languages = props?.global?.settings?.languages ?? [];
    const { t } = useTranslation();

    const [pending, setPending] = React.useState(false);
    const [open, setOpen] = React.useState(false);

    const closeModal = React.useCallback(() => setOpen(false), []);

    const changeLocale = (nextLocale) => {
        if (pending || nextLocale === currentLocale) return;

        setPending(true);
        closeModal();

        const targetPath =
            toLocalePath(
                window.location.pathname,
                nextLocale,
                currentLocale,
                languages,
            ) +
            (window.location.search || "") +
            (window.location.hash || "");

        router.visit(targetPath, {
            preserveScroll: true,
            onFinish: () => setPending(false),
            onError: () => setPending(false),
        });
    };

    React.useEffect(() => {
        if (!open) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                closeModal();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, closeModal]);

    if (!languages.length) return null;

    const currentLanguage =
        languages.find((lang) => lang.locale === currentLocale) ?? languages[0];

    return (
        <div className="lang-x">
            <button
                type="button"
                className={`lang-x-trigger ${open ? "is-open" : ""}`}
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls="language-switcher-modal"
            >
                <span className="lang-x-trigger__copy">
                    <span className="lang-x-trigger__name">
                        {currentLanguage?.name ?? currentLocale.toUpperCase()}
                    </span>
                </span>

                <span className="lang-x-trigger__icon" aria-hidden="true">
                    <FiGlobe />
                </span>
            </button>

            <div
                className={`lang-x-modal ${open ? "open" : ""}`}
                aria-hidden={!open}
            >
                <button
                    type="button"
                    className="lang-x-backdrop"
                    aria-label={t("language.close")}
                    onClick={closeModal}
                />

                <div
                    className="lang-x-dialog"
                    id="language-switcher-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="language-switcher-title"
                >
                    <div className="lang-x-dialog__header">
                        <div className="lang-x-dialog__intro">
                            <span className="lang-x-dialog__eyebrow">
                                {t("language.eyebrow")}
                            </span>
                            <h3 id="language-switcher-title">
                                {t("language.title")}
                            </h3>
                            <p>{t("language.description")}</p>
                        </div>

                        <button
                            type="button"
                            className="lang-x-close"
                            onClick={closeModal}
                            aria-label={t("language.close")}
                        >
                            <FiX />
                        </button>
                    </div>

                    <div className="lang-x-list" role="list">
                        {languages.map((lang) => {
                            const isActive = currentLocale === lang.locale;

                            return (
                                <button
                                    key={lang.id ?? lang.locale}
                                    type="button"
                                    className={`lang-x-item ${
                                        isActive ? "active" : ""
                                    }`}
                                    onClick={() => changeLocale(lang.locale)}
                                    disabled={pending}
                                >
                                    <span
                                        className="lang-x-item__flag"
                                        aria-hidden="true"
                                    >
                                        {getLanguageFlag(lang.locale)}
                                    </span>

                                    <span className="lang-x-item__copy">
                                        <span className="lang-x-name">
                                            {lang.name}
                                        </span>
                                        <span className="lang-x-code">
                                            {lang.locale.toUpperCase()}
                                        </span>
                                    </span>

                                    <span className="lang-x-item__status">
                                        {isActive ? <FiCheck /> : null}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

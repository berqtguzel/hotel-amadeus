import React from "react";
import { Link, usePage } from "@inertiajs/react";
import SeoHead from "@/Components/SeoHead";
import "@/../css/error-page.css";

const CONTENT = {
    403: {
        title: {
            de: "Kein Zugriff",
            en: "Access denied",
            tr: "Erisim engellendi",
        },
        text: {
            de: "Sie haben keine Berechtigung, diese Seite aufzurufen.",
            en: "You do not have permission to access this page.",
            tr: "Bu sayfaya erisim izniniz bulunmuyor.",
        },
    },
    404: {
        title: {
            de: "Seite nicht gefunden",
            en: "Page not found",
            tr: "Sayfa bulunamadi",
        },
        text: {
            de: "Der aufgerufene Link existiert nicht oder wurde verschoben.",
            en: "The page you requested does not exist or has been moved.",
            tr: "Acmaya calistiginiz sayfa bulunamadi veya tasinmis olabilir.",
        },
    },
    500: {
        title: {
            de: "Serverfehler",
            en: "Server error",
            tr: "Sunucu hatasi",
        },
        text: {
            de: "Beim Laden der Seite ist ein unerwarteter Fehler aufgetreten.",
            en: "An unexpected error occurred while loading the page.",
            tr: "Sayfa yuklenirken beklenmeyen bir hata olustu.",
        },
    },
    503: {
        title: {
            de: "Service nicht verfügbar",
            en: "Service unavailable",
            tr: "Servis kullanilamiyor",
        },
        text: {
            de: "Die Seite ist gerade kurzzeitig nicht erreichbar. Bitte versuchen Sie es erneut.",
            en: "The service is temporarily unavailable. Please try again shortly.",
            tr: "Servis gecici olarak kullanilamiyor. Lutfen biraz sonra tekrar deneyin.",
        },
    },
};

function pickLocaleText(map, locale) {
    return map?.[locale] || map?.de || "";
}

export default function ErrorPage({ status = 500 }) {
    const { props } = usePage();
    const locale = props?.locale ?? props?.global?.locale ?? "de";
    const code = Number(status) || 500;
    const content = CONTENT[code] || CONTENT[500];
    const homeHref = locale === "de" ? "/" : `/${locale}`;
    const hotelName =
        props?.global?.settings?.branding?.site_name ||
        props?.global?.settings?.branding?.siteName ||
        props?.global?.hotel_name ||
        "";

    return (
        <>
            <SeoHead
                title={`${code} - ${pickLocaleText(content.title, locale)}`}
                description={pickLocaleText(content.text, locale)}
                noIndex
            />
            <section className="ep-wrap">
                <div className="ep-shell">
                    <div className="ep-code">{code}</div>
                    <div className="ep-card">
                        <span className="ep-kicker">{hotelName}</span>
                        <h1 className="ep-title">
                            {pickLocaleText(content.title, locale)}
                        </h1>
                        <p className="ep-text">
                            {pickLocaleText(content.text, locale)}
                        </p>
                        <div className="ep-actions">
                            <Link
                                href={homeHref}
                                className="ep-btn ep-btn--primary"
                            >
                                {locale === "tr"
                                    ? "Ana sayfaya don"
                                    : locale === "en"
                                      ? "Back to home"
                                      : "Zur Startseite"}
                            </Link>
                            <button
                                type="button"
                                className="ep-btn ep-btn--ghost"
                                onClick={() => {
                                    if (typeof window !== "undefined") {
                                        window.history.back();
                                    }
                                }}
                            >
                                {locale === "tr"
                                    ? "Geri don"
                                    : locale === "en"
                                      ? "Go back"
                                      : "Zuruck"}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

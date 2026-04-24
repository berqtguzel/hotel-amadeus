import React from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import SeoHead from "@/Components/SeoHead";
import { useTranslation } from "@/i18n";
import "@/../css/offer-detail.css";

const buildHighlights = (description = "") => {
    const parts = String(description)
        .split(/[\r\n]+|(?<=[.!?])\s+/)
        .map((item) => item.trim())
        .filter(Boolean);

    return parts.slice(0, 4);
};

export default function OfferShow({ offer: offerId }) {
    const { props } = usePage();
    const locale = props?.locale ?? props?.global?.locale ?? "de";
    const { t } = useTranslation();
    const offers = props?.global?.offerThemes ?? [];
    const base =
        offers.find((item) => {
            const slug = item.slug || item.id;
            return (
                String(item.id) === String(offerId) || slug === String(offerId)
            );
        }) ?? null;

    if (!base) {
        return null;
    }

    const title = base?.name || "";
    const intro = base?.description || t("offerDetail.intro");
    const highlights = buildHighlights(base?.description);
    const file = base?.file || null;
    const pdfSectionTitle =
        locale === "tr"
            ? "PDF Dokumani"
            : locale === "en"
              ? "PDF Document"
              : "PDF Dokument";
    const pdfSectionText =
        locale === "tr"
            ? "Bu teklif ile ilgili PDF dosyasini dogrudan burada acabilir veya yeni sekmede goruntuleyebilirsiniz."
            : locale === "en"
              ? "Open the PDF related to this offer directly here or view it in a new tab."
              : "Sie können das zu diesem Angebot gehörende PDF direkt hier öffnen oder in einem neuen Tab ansehen.";
    const pdfOpenLabel =
        locale === "tr"
            ? "PDF ac"
            : locale === "en"
              ? "Open PDF"
              : "PDF öffnen";
    const pdfDownloadLabel =
        locale === "tr"
            ? "PDF indir"
            : locale === "en"
              ? "Download PDF"
              : "PDF herunterladen";
    const pdfButtonHint =
        locale === "tr"
            ? "Teklifi yeni sekmede tam ekran olarak goruntuleyin."
            : locale === "en"
              ? "View the offer as a full PDF in a new tab."
              : "Angebot als PDF in einem neuen Tab ansehen.";

    return (
        <AppLayout currentRoute="offers">
            <SeoHead title={title} description={intro} image={base?.image} />
            <section className="of-wrap" aria-labelledby="offer-title">
                <div className="of-hero">
                    <div className="of-hero-inner">
                        <img
                            src={base.image}
                            alt={title}
                            className="of-hero-bg"
                            loading="lazy"
                            decoding="async"
                        />

                        <div className="of-hero-layout">
                            <div className="of-hero-copy">
                                <p className="of-eyebrow">
                                    {t("offerDetail.eyebrow")} • Hotel Amadeus
                                    Resort
                                </p>
                                <h1 id="offer-title" className="of-title">
                                    {title}
                                </h1>
                                <p className="of-intro">{intro}</p>
                            </div>

                            <div className="of-hero-badge" aria-hidden="true">
                                <span className="of-hero-tag">
                                    {t("offerDetail.limitedBadge")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="of-layout">
                    <article className="of-main">
                        <div className="of-card">
                            <h2 className="of-card-title">
                                {t("offerDetail.servicesTitle")}
                            </h2>
                            <ul className="of-list">
                                {highlights.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        {file ? (
                            <div className="of-card of-card--pdf">
                                <div className="of-pdf-head">
                                    <div>
                                        <h2 className="of-card-title">
                                            {pdfSectionTitle}
                                        </h2>
                                        <p className="of-text">
                                            {pdfSectionText}
                                        </p>
                                    </div>
                                    <div className="of-pdf-actions">
                                        <a
                                            href={file}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="of-pdf-cta"
                                        >
                                            <span className="of-pdf-cta-copy">
                                                <span className="of-pdf-cta-title">
                                                    {pdfOpenLabel}
                                                </span>
                                                <span className="of-pdf-cta-text">
                                                    {pdfButtonHint}
                                                </span>
                                            </span>
                                            <span
                                                className="of-pdf-cta-arrow"
                                                aria-hidden="true"
                                            >
                                                PDF
                                            </span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </article>

                    <aside
                        className="of-aside"
                        aria-label={t("offerDetail.priceTitle")}
                    >
                        <div className="of-aside-card">
                            <h2 className="of-aside-title">
                                {t("offerDetail.priceTitle")}
                            </h2>
                            <p className="of-text">
                                {t("offerDetail.priceText")}
                            </p>
                            <div className="of-actions">
                                <a
                                    href={`/${locale}/kontakt`}
                                    className="of-btn of-btn--primary"
                                >
                                    {t("offerDetail.requestBtn")}
                                </a>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </AppLayout>
    );
}

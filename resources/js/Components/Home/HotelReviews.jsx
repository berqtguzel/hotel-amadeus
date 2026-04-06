import React from "react";
import { usePage } from "@inertiajs/react";
import { useTranslation } from "@/i18n";
import "../../../css/hotel-reviews.css";

function normalizeReview(r) {
    // PHP servisinden gelen rating zaten 1-5 arası,
    // ama garantiye almak için kalsın
    let rating = Number(r.rating ?? 5);

    return {
        id: r.id ?? String(Math.random()),
        name: r.name ?? r.author_name ?? "Misafir",
        location: r.location ?? "",
        rating,
        text: r.text ?? r.content ?? "", // PHP 'text' olarak gönderiyor
        stay: r.stay ?? "",
    };
}
const stars = (count) => "★".repeat(Math.max(0, Math.min(5, count)));

export default function HotelReviews() {
    const { t } = useTranslation();
    const { props } = usePage();
    const apiReviews = props?.global?.reviews ?? [];
    const widgetsRatings = props?.global?.widgets?.ratings ?? {};
    const reviews = React.useMemo(() => {
        const list =
            Array.isArray(apiReviews) && apiReviews.length
                ? apiReviews
                : (widgetsRatings.reviews ??
                  widgetsRatings.data ??
                  widgetsRatings);
        const arr = Array.isArray(list) ? list : [];
        return arr.map(normalizeReview);
    }, [apiReviews, widgetsRatings]);
    const track = [...reviews, ...reviews];

    return (
        <section className="hr-wrap" aria-label={t("reviews.sectionAria")}>
            <div className="hr-head">
                <span className="eyebrow">{t("reviews.eyebrow")}</span>
                <h1 className="hr-title">{t("reviews.title")}</h1>
                <p className="hr-sub">{t("reviews.subtitle")}</p>
            </div>

            <div
                className="hr-marquee"
                role="region"
                aria-label={t("reviews.marqueeAria")}
            >
                <div className="hr-track">
                    {track.map((r, i) => (
                        <article
                            className="hr-card"
                            key={`${r.id}-${i}`}
                            aria-label={t("reviews.cardAria", { name: r.name })}
                        >
                            <div
                                className="hr-stars"
                                aria-label={t("reviews.ratingAria", {
                                    rating: String(r.rating),
                                })}
                            >
                                {stars(r.rating)}
                            </div>
                            <p className="hr-text">"{r.text}"</p>
                            <div className="hr-meta">
                                <strong>{r.name}</strong>
                                <span>
                                    {[r.location, r.stay]
                                        .filter(Boolean)
                                        .join(" · ") ||
                                        t("reviews.metaFallback")}
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

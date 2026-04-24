import React from "react";
import { usePage } from "@inertiajs/react";
import { FiMessageCircle, FiShield, FiStar } from "react-icons/fi";
import { useTranslation } from "@/i18n";
import "../../../css/hotel-reviews.css";

function normalizeReview(r) {
    const rating = Number(r.rating ?? 5);

    return {
        id: r.id ?? String(Math.random()),
        name: r.name ?? r.author_name ?? "Misafir",
        location: r.location ?? "",
        rating: Math.max(1, Math.min(5, Math.round(rating))),
        text: r.text ?? r.content ?? "",
        stay: r.stay ?? "",
    };
}

const stars = (count) => "\u2605".repeat(Math.max(0, Math.min(5, count)));

export default function HotelReviews() {
    const { t } = useTranslation();
    const { props } = usePage();
    const apiReviews = props?.global?.reviews ?? [];
    const widgetsRatings = props?.global?.widgets?.ratings ?? {};
    const [marqueeEnabled, setMarqueeEnabled] = React.useState(false);

    const reviews = React.useMemo(() => {
        const list =
            Array.isArray(apiReviews) && apiReviews.length
                ? apiReviews
                : (widgetsRatings.reviews ??
                  widgetsRatings.data ??
                  widgetsRatings);

        const arr = Array.isArray(list) ? list : [];
        return arr.map(normalizeReview).filter((item) => item.text);
    }, [apiReviews, widgetsRatings]);

    const averageRating = React.useMemo(() => {
        if (!reviews.length) return 5;

        const total = reviews.reduce(
            (sum, review) => sum + Number(review.rating || 0),
            0,
        );

        return total / reviews.length;
    }, [reviews]);

    const summaryItems = React.useMemo(
        () => [
            {
                icon: FiStar,
                value: averageRating.toFixed(1),
                label: t("reviews.statSatisfaction"),
            },
            {
                icon: FiMessageCircle,
                value: String(reviews.length || 0).padStart(2, "0"),
                label: t("reviews.eyebrow"),
            },
            {
                icon: FiShield,
                value: "5/5",
                label: t("reviews.statSecure"),
            },
        ],
        [averageRating, reviews.length, t],
    );

    React.useEffect(() => {
        if (typeof window === "undefined") return undefined;

        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const pointerQuery = window.matchMedia("(pointer: fine) and (hover: hover)");

        const syncMarqueeState = () => {
            setMarqueeEnabled(
                reviews.length > 2 &&
                    pointerQuery.matches &&
                    !motionQuery.matches,
            );
        };

        syncMarqueeState();
        motionQuery.addEventListener("change", syncMarqueeState);
        pointerQuery.addEventListener("change", syncMarqueeState);

        return () => {
            motionQuery.removeEventListener("change", syncMarqueeState);
            pointerQuery.removeEventListener("change", syncMarqueeState);
        };
    }, [reviews.length]);

    const track = marqueeEnabled ? [...reviews, ...reviews] : reviews;

    if (!reviews.length) {
        return null;
    }

    return (
        <section className="hr-wrap" aria-label={t("reviews.sectionAria")}>
            <div className="hr-shell">
                <div className="hr-backdrop" aria-hidden="true">
                    <span className="hr-orb hr-orb--left" />
                    <span className="hr-orb hr-orb--right" />
                </div>

                <div className="hr-head">
                    <div className="hr-copy">
                        <span className="hr-eyebrow">{t("reviews.eyebrow")}</span>
                        <h1 className="hr-title">{t("reviews.title")}</h1>
                        <p className="hr-sub">{t("reviews.subtitle")}</p>
                    </div>

                    <div className="hr-highlight">
                        <div className="hr-highlight__score">
                            <span className="hr-highlight__label">
                                {t("reviews.eyebrow")}
                            </span>
                            <strong>{averageRating.toFixed(1)}</strong>
                            <span className="hr-highlight__stars">
                                {stars(Math.round(averageRating))}
                            </span>
                        </div>

                        <div className="hr-summary">
                            {summaryItems.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <div
                                        className="hr-summary__item"
                                        key={`${item.label}-${item.value}`}
                                    >
                                        <span className="hr-summary__icon">
                                            <Icon aria-hidden />
                                        </span>
                                        <div className="hr-summary__copy">
                                            <strong>{item.value}</strong>
                                            <span>{item.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div
                    className={`hr-marquee ${marqueeEnabled ? "is-animated" : "is-static"}`}
                    role="region"
                    aria-label={t("reviews.marqueeAria")}
                >
                    <div className="hr-track">
                        {track.map((r, i) => (
                            <article
                                className="hr-card"
                                key={`${r.id}-${i}`}
                                aria-label={t("reviews.cardAria", {
                                    name: r.name,
                                })}
                            >
                                <div className="hr-card__top">
                                    <div
                                        className="hr-stars"
                                        aria-label={t("reviews.ratingAria", {
                                            rating: String(r.rating),
                                        })}
                                    >
                                        {stars(r.rating)}
                                    </div>

                                    <span className="hr-quote" aria-hidden="true">
                                        "
                                    </span>
                                </div>

                                <p className="hr-text">{r.text}</p>

                                <div className="hr-meta">
                                    <strong>{r.name}</strong>
                                    <span>
                                        {[r.location, r.stay]
                                            .filter(Boolean)
                                            .join(" - ") ||
                                            t("reviews.metaFallback")}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

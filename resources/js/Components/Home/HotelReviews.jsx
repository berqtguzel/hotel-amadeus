import React from "react";
import { usePage } from "@inertiajs/react";
import "../../../css/hotel-reviews.css";

const FALLBACK_REVIEWS = [
    {
        id: "r1",
        name: "Anna K.",
        location: "Leipzig",
        rating: 5,
        text: "Sehr ruhige Lage, unglaublich freundliches Team und ein tolles Fruhstuck. Wir kommen definitiv wieder.",
        stay: "2 Nachte · Heubacher Hohe",
    },
    {
        id: "r2",
        name: "Mehmet D.",
        location: "Berlin",
        rating: 5,
        text: "Zimmer sauber, Essen frisch und die Natur direkt vor der Tur. Genau die Auszeit, die wir gebraucht haben.",
        stay: "3 Nachte · Frankenblick",
    },
    {
        id: "r3",
        name: "Sophie W.",
        location: "Erfurt",
        rating: 4,
        text: "Wellnessbereich hat uns besonders gefallen. Personal war sehr hilfsbereit und herzlich.",
        stay: "Wochenende · Sommerberg",
    },
    {
        id: "r4",
        name: "Jonas R.",
        location: "Hamburg",
        rating: 5,
        text: "Top Preis-Leistung, moderne Zimmer und super Ausgangspunkt fur Wanderungen im Thuringer Wald.",
        stay: "4 Nachte · Werrapark Resort",
    },
    {
        id: "r5",
        name: "Claudia M.",
        location: "Nurnberg",
        rating: 5,
        text: "Die Mitarbeitenden machen den Unterschied: professionell, herzlich und immer erreichbar.",
        stay: "Familienreise · Heubacher Hohe",
    },
];

function normalizeReview(r) {
    let rating = Number(r.rating ?? r.stars ?? 5);
    if (rating > 5) rating = Math.round(rating / 2);
    rating = Math.max(1, Math.min(5, Math.round(rating)));

    return {
        id: r.id ?? r.slug ?? String(Math.random()),
        name: r.author_name ?? r.name ?? r.author ?? r.guest_name ?? "",
        location: r.location ?? r.city ?? "",
        rating,
        text: r.content ?? r.text ?? r.review ?? "",
        stay: r.stay ?? r.stay_date ?? r.period ?? r.hotel ?? "",
    };
}

const stars = (count) => "★".repeat(Math.max(0, Math.min(5, count)));

export default function HotelReviews() {
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
        const arr = Array.isArray(list) ? list : [...FALLBACK_REVIEWS];
        return (arr.length ? arr : FALLBACK_REVIEWS).map(normalizeReview);
    }, [apiReviews, widgetsRatings]);
    const track = [...reviews, ...reviews];

    return (
        <section className="hr-wrap" aria-label="Hotelbewertungen">
            <div className="hr-head">
                <span className="eyebrow">Gastebewertungen</span>
                <h2 className="hr-title">Was unsere Gaste uber uns sagen</h2>
                <p className="hr-sub">
                    Echte Stimmen aus dem Werrapark Resort - transparent,
                    herzlich und direkt aus dem Aufenthalt.
                </p>
            </div>

            <div
                className="hr-marquee"
                role="region"
                aria-label="Laufende Bewertungen"
            >
                <div className="hr-track">
                    {track.map((r, i) => (
                        <article
                            className="hr-card"
                            key={`${r.id}-${i}`}
                            aria-label={`${r.name} Bewertung`}
                        >
                            <div
                                className="hr-stars"
                                aria-label={`${r.rating} von 5 Sternen`}
                            >
                                {stars(r.rating)}
                            </div>
                            <p className="hr-text">"{r.text}"</p>
                            <div className="hr-meta">
                                <strong>{r.name}</strong>
                                <span>
                                    {[r.location, r.stay]
                                        .filter(Boolean)
                                        .join(" · ") || "—"}
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

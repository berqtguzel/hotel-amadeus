"use client";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import "../../../css/rooms-gallery.css";
import Aurora from "../ReactBits/Backgrounds/Aurora";

const SAMPLE = [
    { src: "/images/rooms/room.png", title: "Standard Doppelzimmer" },
    { src: "/images/rooms/room.png", title: "Einzelzimmer – hell & ruhig" },
    { src: "/images/rooms/room.png", title: "Komfort Doppelzimmer" },
    { src: "/images/rooms/room.png", title: "Sitzecke & Schreibtisch" },
    { src: "/images/rooms/room.png", title: "Familienzimmer 2+2" },
    { src: "/images/rooms/room.png", title: "Hotelhaus – Außenansicht" },
    { src: "/images/rooms/room.png", title: "Studio – Wohnbereich" },
    { src: "/images/rooms/room.png", title: "Zimmer mit Balkon" },
    { src: "/images/rooms/room.png", title: "Suite – Holzverkleidung" },
    { src: "/images/rooms/room.png", title: "Studio – Wohnbereich" },
    { src: "/images/rooms/room.png", title: "Zimmer mit Balkon" },
    { src: "/images/rooms/room.png", title: "Suite – Holzverkleidung" },
];

export default function RoomsGallery({
    photos = SAMPLE,
    eyebrow = "Galerie",
    heading = "Zimmer & Impressionen",
    sub = "Einblicke in unsere freundlich gestalteten Zimmer, Studios und Suiten.",
}) {
    const items = useMemo(
        () =>
            photos.map((p, i) => ({
                id: `rg-${i}`,
                src: p.src,
                title: p.title || "",
            })),
        [photos],
    );

    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);

    const openAt = useCallback((i) => {
        setIndex(i);
        setOpen(true);
    }, []);
    const close = useCallback(() => setOpen(false), []);
    const prev = useCallback(
        () => setIndex((i) => (i - 1 + items.length) % items.length),
        [items.length],
    );
    const next = useCallback(
        () => setIndex((i) => (i + 1) % items.length),
        [items.length],
    );

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") close();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, close, prev, next]);

    return (
        <section className="rg-wrap" aria-labelledby="rg-title">
            <div className="rg-aurora" aria-hidden="true">
                <Aurora
                    colorStops={["#7AE2B3", "#9FE5C7", "#1A5D48"]}
                    speed={0.7}
                    blend={0.8}
                    amplitude={0.6}
                />
            </div>

            <div className="rg-shell">
                <header className="rg-top">
                    <span className="eyebrow">{eyebrow}</span>
                    <h2 id="rg-title" className="rg-title">
                        {heading}
                    </h2>
                    <p className="rg-sub">{sub}</p>
                </header>

                <div className="rg-gallery" role="list">
                    {items.map((it, i) => (
                        <figure className="rg-item" key={it.id} role="listitem">
                            <button
                                className="rg-card"
                                type="button"
                                onClick={() => openAt(i)}
                                aria-label={`${it.title || "Foto"} vergrößern`}
                            >
                                <img
                                    className="rg-img"
                                    src={it.src}
                                    alt={it.title || "Zimmer Foto"}
                                    loading="lazy"
                                />
                                {it.title && (
                                    <figcaption className="rg-cap">
                                        {it.title}
                                    </figcaption>
                                )}
                            </button>
                        </figure>
                    ))}
                </div>
            </div>

            {open && (
                <div className="rg-lightbox" role="dialog" aria-modal="true">
                    <button
                        className="rg-x"
                        onClick={close}
                        aria-label="Schließen"
                    >
                        ×
                    </button>
                    <button
                        className="rg-nav rg-prev"
                        onClick={prev}
                        aria-label="Vorheriges Bild"
                    >
                        ‹
                    </button>
                    <button
                        className="rg-nav rg-next"
                        onClick={next}
                        aria-label="Nächstes Bild"
                    >
                        ›
                    </button>

                    <div className="rg-lightbox-inner">
                        <img
                            className="rg-lightbox-img"
                            src={items[index].src}
                            alt={items[index].title || "Foto"}
                        />
                        {items[index].title && (
                            <div className="rg-lightbox-cap">
                                {items[index].title}
                            </div>
                        )}
                        <div className="rg-counter">
                            {index + 1} / {items.length}
                        </div>
                    </div>

                    <div className="rg-backdrop" onClick={close} />
                </div>
            )}
        </section>
    );
}

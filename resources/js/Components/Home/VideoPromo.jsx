import React from "react";
import "../../../css/video-promo.css";
import { useTranslation } from "@/i18n";

export default function VideoPromo({
    poster = "/images/Thumbnail2.webp",
    videoId = "dQw4w9WgXcQ",
}) {
    const { t, locale } = useTranslation();
    const [playing, setPlaying] = React.useState(false);
    const title = t("videoPromo.title");
    const subtitle = t("videoPromo.subtitle");
    const alt = t("videoPromo.alt");

    const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&hl=${locale}&playsinline=1`;

    return (
        <section className="vp-section">
            <div className="vp-shell">
                <header className="vp-head">
                    <span className="eyebrow">{t("videoPromo.eyebrow")}</span>
                    <h1 className="vp-title">{title}</h1>
                    <p className="vp-subtitle">{subtitle}</p>
                </header>

                <div className={`vp-aspect ${playing ? "is-playing" : ""}`}>
                    {playing ? (
                        <>
                            <iframe
                                className="vp-iframe"
                                src={src}
                                title={title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                            <button
                                type="button"
                                className="vp-reset"
                                onClick={() => setPlaying(false)}
                            >
                                {t("videoPromo.preview")}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="vp-poster"
                            onClick={() => setPlaying(true)}
                            aria-label={t("videoPromo.playAria")}
                        >
                            <img className="vp-img" src={poster} alt={alt} />
                            <span className="vp-vignette" aria-hidden="true" />
                            <span className="vp-play" aria-hidden="true">
                                <svg viewBox="0 0 72 72" width="72" height="72">
                                    <circle
                                        cx="36"
                                        cy="36"
                                        r="34"
                                        fill="rgba(16,185,129,.92)"
                                    />
                                    <polygon
                                        points="30,23 52,36 30,49"
                                        fill="#fff"
                                    />
                                </svg>
                            </span>
                            <span className="vp-meta" aria-hidden="true">
                                {t("videoPromo.meta")}
                            </span>
                            <span className="vp-cta">
                                {t("videoPromo.cta")}
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}

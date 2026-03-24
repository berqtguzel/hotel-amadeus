import React, { useState, useEffect, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import "../../css/home.css";

function isVideoUrl(url) {
    if (!url || typeof url !== "string") return false;
    const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase();
    return ["mp4", "webm", "ogg", "mov"].includes(ext ?? "");
}

function getVideoType(url) {
    const ext = url?.split(".").pop()?.split("?")[0]?.toLowerCase();
    const types = {
        mp4: "video/mp4",
        webm: "video/webm",
        ogg: "video/ogg",
        mov: "video/mp4",
    };
    return types[ext] ?? "video/mp4";
}

export default function Hero() {
    const { props } = usePage();
    const slider = props?.global?.slider ?? null;
    const slides = slider?.slides ?? [];
    const [activeIndex, setActiveIndex] = useState(0);
    const videoRefs = useRef({});

    console.log("Slider data:", slider);

    const hasSlider = Array.isArray(slides) && slides.length > 0;
    const firstSlide = slides[0];
    const title =
        (slides[activeIndex] ?? firstSlide)?.title ||
        slider?.title ||
        "Willkommen im Werrapark";
    const subtitle =
        (slides[activeIndex] ?? firstSlide)?.description ||
        "Ihre Oase der Ruhe inmitten der Natur";

    useEffect(() => {
        if (!hasSlider || slides.length < 2) return;
        const id = setInterval(() => {
            setActiveIndex((i) => (i + 1) % slides.length);
        }, 5000);
        return () => clearInterval(id);
    }, [hasSlider, slides.length]);

    useEffect(() => {
        Object.values(videoRefs.current).forEach((el) => {
            if (!el) return;
            const slideEl = el.closest(".hero-slider-slide");
            if (slideEl?.classList.contains("is-active")) {
                el.play().catch(() => {});
            } else {
                el.pause();
                el.currentTime = 0;
            }
        });
    }, [activeIndex, hasSlider]);

    return (
        <section className="hero" aria-label="Willkommen im Werrapark">
            {hasSlider ? (
                <div className="hero-slider">
                    {slides.map((s, i) => {
                        const hasVideo =
                            s.video || (s.image && isVideoUrl(s.image));
                        const mediaUrl = hasVideo
                            ? s.video || s.image
                            : s.image;

                        return (
                            <div
                                key={i}
                                className={`hero-slider-slide ${i === activeIndex ? "is-active" : ""}`}
                                style={
                                    !hasVideo && s.image
                                        ? { backgroundImage: `url(${s.image})` }
                                        : undefined
                                }
                            >
                                {hasVideo && mediaUrl && (
                                    <video
                                        ref={(el) => {
                                            videoRefs.current[i] = el;
                                        }}
                                        className="hero-slider-video"
                                        autoPlay={i === activeIndex}
                                        muted
                                        loop
                                        playsInline
                                        preload="auto"
                                        poster={s.poster || s.image}
                                    >
                                        <source
                                            src={mediaUrl}
                                            type={getVideoType(mediaUrl)}
                                        />
                                        Ihr Browser unterstützt dieses Video
                                        nicht.
                                    </video>
                                )}
                            </div>
                        );
                    })}
                    <div className="hero-slider-dots">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                className={`hero-slider-dot ${i === activeIndex ? "is-active" : ""}`}
                                onClick={() => setActiveIndex(i)}
                                aria-label={`Slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <video
                    className="hero-bg"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                >
                    <source
                        src="/videos/werraparkvideo.webm"
                        type="video/webm"
                    />
                    <source src="/videos/werraparkvideo.mp4" type="video/mp4" />
                    Ihr Browser unterstützt dieses Video nicht.
                </video>
            )}

            <div className="hero-overlay" aria-hidden />

            <div className="hero-content container">
                <h1>{title}</h1>
                <p>{subtitle}</p>
                <div className="hero-ctas">
                    <Link href="/offers" className="btn btn--primary">
                        Jetzt buchen
                    </Link>
                    <Link href="/rooms" className="btn btn--ghost">
                        Zimmer &amp; Suiten
                    </Link>
                </div>
            </div>
        </section>
    );
}

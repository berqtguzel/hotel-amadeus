import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
} from "react";
import { usePage } from "@inertiajs/react";
import "../../css/home.css";

// --- Yardımcı Fonksiyonlar ---
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
    const [activeIndex, setActiveIndex] = useState(0);
    const videoRefs = useRef({});

    // Sürükleme (Drag) için state'ler
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const sliderRef = useRef(null);

    // 1. Tüm slide'ları birleştir
    const allSlides = useMemo(() => {
        const sliderData = props?.global?.slider;
        let combined = [];

        if (sliderData?.is_list && Array.isArray(sliderData.sliders)) {
            sliderData.sliders.forEach((sliderObj) => {
                if (Array.isArray(sliderObj.slides)) {
                    combined = [...combined, ...sliderObj.slides];
                }
            });
        } else if (Array.isArray(sliderData?.slides)) {
            combined = sliderData.slides;
        }

        return combined
            .map((s) => ({
                image: s.image || s.url || s.video,
                title: s.title || "",
                description: s.description || "",
            }))
            .filter((s) => s.image);
    }, [props?.global?.slider]);

    const nextSlide = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % allSlides.length);
    }, [allSlides.length]);

    const prevSlide = useCallback(() => {
        setActiveIndex(
            (prev) => (prev - 1 + allSlides.length) % allSlides.length,
        );
    }, [allSlides.length]);

    // 2. Otomatik Kaydırma (Sürükleme yaparken durur)
    useEffect(() => {
        if (allSlides.length < 2 || isDragging) return;

        const interval = setInterval(() => {
            nextSlide();
        }, 5000);

        return () => clearInterval(interval);
    }, [allSlides.length, nextSlide, activeIndex, isDragging]);

    // 3. Sürükleme Mantığı (Mouse & Touch)
    const handleDragStart = (e) => {
        setIsDragging(true);
        setStartX(e.pageX || e.touches[0].pageX);
    };

    const handleDragEnd = (e) => {
        if (!isDragging) return;
        const endX =
            e.pageX || (e.changedTouches ? e.changedTouches[0].pageX : 0);
        const diff = startX - endX;

        // Hassasiyet eşiği (50px sürükleyince kaydır)
        if (diff > 50) {
            nextSlide();
        } else if (diff < -50) {
            prevSlide();
        }
        setIsDragging(false);
    };

    // 4. Video Kontrolü
    useEffect(() => {
        Object.values(videoRefs.current).forEach((el, idx) => {
            if (!el) return;
            if (parseInt(idx) === activeIndex) {
                el.play().catch(() => {});
            } else {
                el.pause();
                el.currentTime = 0;
            }
        });
    }, [activeIndex]);

    const hasSlides = allSlides.length > 0;

    return (
        <section
            className={`hero ${isDragging ? "is-dragging" : ""}`}
            aria-label="Hero Slider"
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onMouseLeave={() => setIsDragging(false)}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
            {hasSlides ? (
                <div className="hero-slider" ref={sliderRef}>
                    {allSlides.map((s, i) => {
                        const isVideo = isVideoUrl(s.image);
                        return (
                            <div
                                key={i}
                                className={`hero-slider-slide ${i === activeIndex ? "is-active" : ""}`}
                                style={
                                    !isVideo
                                        ? { backgroundImage: `url(${s.image})` }
                                        : {}
                                }
                            >
                                {isVideo && (
                                    <video
                                        ref={(el) =>
                                            (videoRefs.current[i] = el)
                                        }
                                        className="hero-slider-video"
                                        muted
                                        loop
                                        playsInline
                                        preload="auto"
                                    >
                                        <source
                                            src={s.image}
                                            type={getVideoType(s.image)}
                                        />
                                    </video>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <video className="hero-bg" autoPlay muted loop playsInline>
                    <source
                        src="/videos/Hotel Amadeusvideo.mp4"
                        type="video/mp4"
                    />
                </video>
            )}

            <div className="hero-overlay" style={{ pointerEvents: "none" }} />

            <div
                className="hero-content container"
                style={{ pointerEvents: "none" }}
            >
                <h1>{allSlides[activeIndex]?.title || "Willkommen"}</h1>
                <p>{allSlides[activeIndex]?.description}</p>
            </div>
        </section>
    );
}

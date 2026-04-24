"use client";

import React, {
    useMemo,
    useRef,
    useState,
    useEffect,
    useCallback,
} from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    FiCheck,
    FiUsers,
    FiCreditCard,
    FiChevronRight,
    FiLayers,
    FiArrowLeft,
    FiArrowRight,
} from "react-icons/fi";
import "../../../css/rooms-showcase.css";
import { useTranslation } from "@/i18n";
import DotField from "@/Components/DotField";

// --- YARDIMCI FONKSİYONLAR ---

function stripHtml(value = "") {
    return String(value)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function summarizeText(value = "", maxLength = 138) {
    const text = stripHtml(value);
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
}

function normalizeList(items) {
    return (Array.isArray(items) ? items : [])
        .map((item) =>
            typeof item === "string"
                ? item
                : (item?.name ?? item?.label ?? null),
        )
        .filter(Boolean);
}

function slugifyRoom(value = "") {
    return String(value)
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// --- BİLEŞENLER ---

function RoomCard({ hotel, locale, t, featured = false, onClick }) {
    const roomIdentifier = hotel.slug || slugifyRoom(hotel.name) || hotel.id;
    const href = `/${locale}/rooms/${roomIdentifier}`;

    const boardSummary = (hotel.boardTypes || [])
        .map((item) => item?.description ?? item?.name ?? item?.code)
        .filter(Boolean)
        .slice(0, 2);

    const featureSummary = (hotel.features || [])
        .map((item) => item?.name)
        .filter(Boolean)
        .slice(0, 4);

    const detailList = normalizeList(hotel.items).slice(0, 3);
    const cardSummary = summarizeText(hotel.description, 138);

    const factItems = [
        hotel.capacity
            ? {
                  icon: <FiUsers aria-hidden />,
                  label: t("rooms.capacityLabel"),
                  value: t("rooms.capacityValue", { count: hotel.capacity }),
              }
            : null,
        boardSummary.length
            ? {
                  icon: <FiLayers aria-hidden />,
                  label: t("rooms.boardTypesLabel"),
                  value: boardSummary.join(" · "),
              }
            : null,
        hotel.price
            ? {
                  icon: <FiCreditCard aria-hidden />,
                  label: t("rooms.priceLabel"),
                  value: hotel.price,
              }
            : null,
    ].filter(Boolean);

    return (
        <Link
            href={href}
            className={`rsm-card ${featured ? "is-featured" : ""}`}
            as="article"
            aria-labelledby={`room-card-${hotel.id ?? roomIdentifier}`}
            style={{
                textDecoration: "none",
                color: "inherit",
            }}
            onClick={onClick}
        >
            <div className="rsm-media">
                <div className="rsm-media__frame">
                    <img
                        className="rsm-media__image"
                        src={hotel.image}
                        alt={hotel.name}
                        loading="lazy"
                        decoding="async"
                    />
                    <div className="rsm-media__overlay" />
                    <div className="rsm-badge-row">
                        {hotel.price && (
                            <span className="rsm-badge rsm-badge--solid">
                                {hotel.price}
                            </span>
                        )}
                        {hotel.capacity && (
                            <span className="rsm-badge">
                                <FiUsers aria-hidden />
                                {t("rooms.capacityValue", {
                                    count: hotel.capacity,
                                })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="rsm-body">
                <div className="rsm-heading-row">
                    <div className="rsm-heading-copy">
                        <h3
                            id={`room-card-${hotel.id ?? roomIdentifier}`}
                            className="rsm-title"
                        >
                            {hotel.name}
                        </h3>
                        {cardSummary && (
                            <p className="rsm-desc">{cardSummary}</p>
                        )}
                    </div>
                </div>

                {factItems.length > 0 && (
                    <div className="rsm-facts">
                        {factItems.map((fact, idx) => (
                            <div
                                className="rsm-fact"
                                key={`${fact.label}-${idx}`}
                            >
                                <span className="rsm-fact__icon">
                                    {fact.icon}
                                </span>
                                <div className="rsm-fact__copy">
                                    <span className="rsm-fact__label">
                                        {fact.label}
                                    </span>
                                    <strong className="rsm-fact__value">
                                        {fact.value}
                                    </strong>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {featureSummary.length > 0 && (
                    <div className="rsm-chips">
                        {featureSummary.map((item, idx) => (
                            <span className="rsm-chip" key={idx}>
                                {item}
                            </span>
                        ))}
                    </div>
                )}

                {detailList.length > 0 && (
                    <ul className="rsm-points">
                        {detailList.map((item, idx) => (
                            <li key={idx}>
                                <FiCheck aria-hidden />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="rsm-cta">
                    <span>{t("rooms.explore")}</span>
                    <span className="rsm-cta__icon">
                        <FiChevronRight aria-hidden />
                    </span>
                </div>
            </div>
        </Link>
    );
}

// --- ANA BİLEŞEN ---

export default function RoomsShowcase() {
    const { props } = usePage();
    const hotels = Array.isArray(props?.rooms) ? props.rooms : [];
    const { t, locale } = useTranslation();

    const sliderRef = useRef(null);
    const sectionRef = useRef(null);
    const isHovering = useRef(false);
    const hoverRef = useRef(false);

    const [activeIndex, setActiveIndex] = useState(0);
    const [showDotField, setShowDotField] = useState(false);

    const cards = useMemo(() => hotels, [hotels]);

    const scrollToIndex = useCallback((index) => {
        if (!sliderRef.current) return;

        const slides = sliderRef.current.querySelectorAll(".rsm-slide");
        if (!slides[index]) return;

        const container = sliderRef.current;
        const slide = slides[index];

        const offset =
            slide.offsetLeft -
            container.offsetWidth / 2 +
            slide.offsetWidth / 2;

        container.scrollTo({
            left: offset,
            behavior: "smooth",
        });

        setActiveIndex(index);
    }, []);

    // Sınırsız döngü için güncellendi
    const scroll = (direction) => {
        if (!cards.length) return;
        const next = (activeIndex + direction + cards.length) % cards.length;
        scrollToIndex(next);
    };

    // Scroll pozisyonunu dinleyip aktif kartı bulma
    useEffect(() => {
        const el = sliderRef.current;
        if (!el || cards.length === 0) return;

        let timeoutId;
        const handle = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const slides = el.querySelectorAll(".rsm-slide");
                let closest = 0;
                let min = Infinity;

                slides.forEach((slide, i) => {
                    const diff = Math.abs(
                        slide.offsetLeft -
                            el.scrollLeft -
                            el.offsetWidth / 2 +
                            slide.offsetWidth / 2,
                    );

                    if (diff < min) {
                        min = diff;
                        closest = i;
                    }
                });

                setActiveIndex(closest);
            }, 50);
        };

        el.addEventListener("scroll", handle, { passive: true });
        handle(); // İlk render için çalıştır

        return () => {
            el.removeEventListener("scroll", handle);
            clearTimeout(timeoutId);
        };
    }, [cards.length]);

    // Otomatik Kaydırma (Auto-Play) İşlemi
    useEffect(() => {
        if (!cards.length) return;

        const interval = setInterval(() => {
            if (isHovering.current || hoverRef.current) return;

            setActiveIndex((prev) => {
                const next = (prev + 1) % cards.length;
                scrollToIndex(next);
                return next;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [cards.length, scrollToIndex]);

    // Arka Plan Efekti (DotField) Performans Kontrolü
    useEffect(() => {
        if (typeof window === "undefined") return undefined;

        const motionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );
        const pointerQuery = window.matchMedia(
            "(pointer: fine) and (hover: hover)",
        );

        let observer;

        const syncEffectState = () => {
            if (
                motionQuery.matches ||
                !pointerQuery.matches ||
                !sectionRef.current
            ) {
                setShowDotField(false);
                if (observer) {
                    observer.disconnect();
                    observer = null;
                }
                return;
            }

            if (!observer) {
                observer = new IntersectionObserver(
                    ([entry]) => {
                        setShowDotField(entry.isIntersecting);
                    },
                    { threshold: 0.12 },
                );
                observer.observe(sectionRef.current);
            }
        };

        syncEffectState();
        motionQuery.addEventListener("change", syncEffectState);
        pointerQuery.addEventListener("change", syncEffectState);

        return () => {
            motionQuery.removeEventListener("change", syncEffectState);
            pointerQuery.removeEventListener("change", syncEffectState);
            observer?.disconnect();
        };
    }, []);

    // Veri Yoksa Boş Durum Gösterimi
    if (!cards.length) {
        return (
            <section className="rsm-wrap" aria-labelledby="rooms-title">
                <div className="rsm-shell">
                    <header className="rsm-header">
                        <p className="rsm-eyebrow">{t("rooms.eyebrow")}</p>
                        <h1 id="rooms-title" className="rsm-heading">
                            {t("rooms.title")}
                        </h1>
                        <p className="rsm-intro">{t("rooms.intro")}</p>
                    </header>

                    <article className="rsm-empty">
                        <h3>{t("rooms.emptyTitle")}</h3>
                        <p>{t("rooms.emptyText")}</p>
                    </article>
                </div>
            </section>
        );
    }

    console.log("RoomsShowcase Rendered with hotels:", hotels);
    return (
        <section
            className="rsm-wrap"
            aria-labelledby="rooms-title"
            ref={sectionRef}
        >
            <div className="rsm-dotfield-bg" aria-hidden="true">
                <DotField
                    enabled={showDotField}
                    dotRadius={1.5}
                    dotSpacing={18}
                    bulgeStrength={54}
                    glowRadius={0}
                    sparkle={false}
                    waveAmplitude={0}
                    cursorRadius={320}
                    cursorForce={0.06}
                    bulgeOnly
                    gradientFrom="#A855F7"
                    gradientTo="#B497CF"
                    glowColor="#120F17"
                />
            </div>
            <div className="rsm-shell">
                <header className="rsm-header">
                    <div className="rsm-header__top">
                        <div>
                            <p className="rsm-eyebrow">{t("rooms.eyebrow")}</p>
                            <h1 id="rooms-title" className="rsm-heading">
                                {t("rooms.title")}
                            </h1>
                        </div>
                    </div>

                    <p className="rsm-intro">{t("rooms.intro")}</p>
                </header>

                {/* Slider Alanı ve Yan Oklar */}
                <div style={{ position: "relative" }}>
                    {/* Sol Ok (Masaüstü) */}
                    <div
                        className="rsm-controls--desktop"
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "16px",
                            transform: "translateY(-50%)",
                            zIndex: 10,
                        }}
                    >
                        <button
                            type="button"
                            className="rsm-nav"
                            onClick={() => scroll(-1)}
                            aria-label={t("rooms.previous", "Previous room")}
                        >
                            <FiArrowLeft />
                        </button>
                    </div>

                    {/* Sağ Ok (Masaüstü) */}
                    <div
                        className="rsm-controls--desktop"
                        style={{
                            position: "absolute",
                            top: "50%",
                            right: "16px",
                            transform: "translateY(-50%)",
                            zIndex: 10,
                        }}
                    >
                        <button
                            type="button"
                            className="rsm-nav"
                            onClick={() => scroll(1)}
                            aria-label={t("rooms.next", "Next room")}
                        >
                            <FiArrowRight />
                        </button>
                    </div>

                    <div
                        className="rsm-slider-shell"
                        onMouseEnter={() => (isHovering.current = true)}
                        onMouseLeave={() => (isHovering.current = false)}
                        onTouchStart={() => (isHovering.current = true)}
                        onTouchEnd={() => (isHovering.current = false)}
                    >
                        <div
                            className="rsm-track center-mode"
                            ref={sliderRef}
                            onMouseEnter={() => (hoverRef.current = true)}
                            onMouseLeave={() => (hoverRef.current = false)}
                        >
                            {cards.map((hotel, i) => (
                                <div
                                    key={hotel.id ?? i}
                                    className={`rsm-slide ${i === activeIndex ? "active" : ""}`}
                                >
                                    <RoomCard
                                        hotel={hotel}
                                        locale={locale}
                                        t={t}
                                        featured={i === activeIndex}
                                        onClick={(e) => {
                                            if (i !== activeIndex) {
                                                e.preventDefault();
                                                scrollToIndex(i);
                                            }
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobil Yönlendirme Kontrolleri */}
                <div className="rsm-footer">
                    <div className="rsm-controls rsm-controls--mobile">
                        <button
                            type="button"
                            className="rsm-nav"
                            onClick={() => scroll(-1)}
                            aria-label={t("rooms.previous", "Previous room")}
                        >
                            <FiArrowLeft />
                        </button>

                        <button
                            type="button"
                            className="rsm-nav"
                            onClick={() => scroll(1)}
                            aria-label={t("rooms.next", "Next room")}
                        >
                            <FiArrowRight />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

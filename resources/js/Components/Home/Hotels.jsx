import React from "react";
import "../../../css/hotels.css";
import { usePage } from "@inertiajs/react";
import { ArrowUpRight, Mail, MapPin, Phone, Star } from "lucide-react";
import { useTranslation } from "@/i18n";

const slugifyHotel = (value = "") =>
    String(value)
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const stripHtml = (value = "") =>
    String(value)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const summarize = (value = "", maxLength = 150) => {
    const text = stripHtml(value);
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
};

export default function Hotels() {
    const { global } = usePage().props;
    const hotelList = Array.isArray(global?.hotels) ? global.hotels : [];
    const orderedHotels = [...hotelList].reverse();
    const locale = global?.locale ?? "de";
    const { t } = useTranslation();
    const primaryHotel = orderedHotels[0] ?? null;

    const getHotelHref = (hotel, hotelSlug) =>
        hotel?.website_link || `/${locale}/hotels/${hotelSlug}`;

    const isExternalUrl = (url = "") => /^https?:\/\//i.test(url);

    const handleCardNavigation = (url) => {
        if (!url) return;
        window.location.href = url;
    };

    const primaryLocation =
        primaryHotel?.location ||
        primaryHotel?.city ||
        primaryHotel?.address ||
        "";
    const primaryStars = Math.max(
        0,
        Math.floor(Number(primaryHotel?.stars || 0)),
    );

    return (
        <section
            id="hotels"
            className="hotels-section"
            aria-labelledby="hotels-heading"
        >
            <div className="hotels-background" />

            <div className="hotels-container">
                <div className="hotels-hero">
                    <div className="hotels-copy">
                        <span className="hotels-eyebrow">
                            {locale === "tr"
                                ? "Konaklama koleksiyonu"
                                : locale === "en"
                                  ? "Stay collection"
                                  : "Hotelkollektion"}
                        </span>

                        <h2 id="hotels-heading" className="hotels-title">
                            {t("hotels.title")}
                        </h2>

                        <p className="hotels-subtitle" role="doc-subtitle">
                            {t("hotels.subtitle")}
                        </p>
                    </div>

                    <div className="hotels-stats">
                        <div className="hotels-stat-card hotels-stat-card--spotlight">
                            <strong>
                                {primaryHotel?.name ||
                                    (locale === "tr"
                                        ? "Seckin otel deneyimi"
                                        : locale === "en"
                                          ? "Distinctive hotel experience"
                                          : "Exklusives Hotelerlebnis")}
                            </strong>
                            {primaryLocation ? (
                                <p className="hotels-stat-card__meta">
                                    <MapPin size={14} />
                                    <span>{primaryLocation}</span>
                                </p>
                            ) : null}
                            <div className="hotels-stat-card__chips">
                                <span className="hotels-stat-chip">
                                    <Star size={13} />
                                    {primaryStars
                                        ? `${primaryStars}.0`
                                        : locale === "tr"
                                          ? "Premium"
                                          : locale === "en"
                                            ? "Premium"
                                            : "Premium"}
                                </span>
                                <span className="hotels-stat-chip">
                                    {primaryHotel?.phone || primaryHotel?.email
                                        ? locale === "tr"
                                            ? "Dogrudan iletisim"
                                            : locale === "en"
                                              ? "Direct contact"
                                              : "Direkter Kontakt"
                                        : locale === "tr"
                                          ? "Detayli bilgi"
                                          : locale === "en"
                                            ? "More details"
                                            : "Mehr Details"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className={`hotel-grid ${
                        orderedHotels.length === 1 ? "hotel-grid--single" : ""
                    }`}
                >
                    {orderedHotels.length > 0 ? (
                        orderedHotels.map((hotel, index) => {
                            const hotelSlug =
                                hotel?.slug ||
                                slugifyHotel(hotel?.name) ||
                                hotel?.id;

                            const hotelHref = getHotelHref(hotel, hotelSlug);
                            const external = isExternalUrl(hotelHref);
                            const summary = summarize(
                                hotel?.description ||
                                    hotel?.intro ||
                                    hotel?.tagline ||
                                    "",
                                index === 0 ? 180 : 132,
                            );
                            const location =
                                hotel?.location ||
                                hotel?.city ||
                                hotel?.address ||
                                "";
                            const starCount = Math.max(
                                0,
                                Math.floor(Number(hotel?.stars || 0)),
                            );

                            return (
                                <article
                                    className={`hotel-card eb-reset ${
                                        index === 0
                                            ? "hotel-card--featured"
                                            : ""
                                    }`}
                                    key={index}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`${hotel?.name} details`}
                                    onClick={() =>
                                        handleCardNavigation(hotelHref)
                                    }
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
                                            e.preventDefault();
                                            handleCardNavigation(hotelHref);
                                        }
                                    }}
                                >
                                    <div className="hotel-image">
                                        <img
                                            src={
                                                hotel?.cover_image ||
                                                "/images/placeholder-hotel.jpg"
                                            }
                                            alt={hotel?.name || "Hotel"}
                                            loading="lazy"
                                        />

                                        {index === 0 ? (
                                            <span className="hotel-badge">
                                                {locale === "tr"
                                                    ? "One cikan"
                                                    : locale === "en"
                                                      ? "Featured"
                                                      : "Highlight"}
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="hotel-body">
                                        {summary ? (
                                            <p className="hotel-summary">
                                                {summary}
                                            </p>
                                        ) : null}

                                        <div className="hotel-contact">
                                            {hotel?.email ? (
                                                <a
                                                    href={`mailto:${hotel.email}`}
                                                    className="hotel-link"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <Mail size={16} />
                                                    <span>{hotel.email}</span>
                                                </a>
                                            ) : null}

                                            {hotel?.phone ? (
                                                <a
                                                    href={`tel:${hotel.phone}`}
                                                    className="hotel-link"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <Phone size={16} />
                                                    <span>{hotel.phone}</span>
                                                </a>
                                            ) : null}
                                        </div>

                                        <a
                                            className="hotel-detail-btn"
                                            href={hotelHref}
                                            {...(external
                                                ? {
                                                      target: "_blank",
                                                      rel: "noopener noreferrer",
                                                  }
                                                : {})}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span className="hotel-detail-copy">
                                                <small>
                                                    {locale === "tr"
                                                        ? "Detaylari incele"
                                                        : locale === "en"
                                                          ? "See more"
                                                          : "Mehr entdecken"}
                                                </small>
                                                <strong>
                                                    {t("hotels.cta")}
                                                </strong>
                                            </span>
                                            <span className="hotel-detail-icon">
                                                <ArrowUpRight size={18} />
                                            </span>
                                        </a>
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <p className="no-hotels">
                            {t("hotels.no_data") || "Keine Hotels gefunden."}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}

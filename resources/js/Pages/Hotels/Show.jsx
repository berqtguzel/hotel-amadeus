import React from "react";
import { usePage } from "@inertiajs/react";
import {
    MapPin,
    Mail,
    Phone,
    Star,
    Sparkles,
    AlignLeft,
    Globe,
} from "lucide-react";
import AppLayout from "@/Layouts/AppLayout";
import SeoHead from "@/Components/SeoHead";
import { useTranslation } from "@/i18n";
import "@/../css/hotel-detail.css";

const slugifyHotel = (value = "") =>
    String(value)
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const splitToChips = (value) => {
    if (Array.isArray(value)) {
        return value
            .flatMap((item) => splitToChips(item))
            .filter(Boolean);
    }

    if (value == null) return [];

    if (typeof value === "object") {
        return splitToChips(Object.values(value));
    }

    return String(value)
        .split(/[\r\n,;|•]+/g)
        .map((item) => item.trim())
        .filter(Boolean);
};

export default function HotelShow({ hotel: hotelParam }) {
    const { props } = usePage();
    const { t } = useTranslation();

    const hotelList = props.global?.hotels || [];
    const locale = props.global?.locale ?? "de";

    const data = hotelList.find((h) => {
        const slug = h.slug || slugifyHotel(h.name);
        return (
            String(h.id) === String(hotelParam) || slug === String(hotelParam)
        );
    });

    if (!data) {
        return (
            <AppLayout currentRoute="rooms">
                <div
                    className="hd-wrap"
                    style={{ padding: "100px", textAlign: "center" }}
                >
                    <h2>
                        {t("hotelDetail.notFound") || "Hotel nicht gefunden"}
                    </h2>
                    <a href={`/${locale}/hotels`}>
                        {t("hotelDetail.backToList") || "Zurück zur Liste"}
                    </a>
                </div>
            </AppLayout>
        );
    }

    const amenities = React.useMemo(() => {
        const serviceItems = splitToChips(data.services);
        const amenityItems = splitToChips(data.amenities);
        const raw = serviceItems.length > 0 ? serviceItems : amenityItems;

        if (raw.length === 0) return ["WiFi", "TV", "Spa"];

        const seen = new Set();
        return raw.filter((item) => {
            const key = item.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [data.services, data.amenities]);
    const descriptionParagraphs = String(data.description || "")
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    const websiteHref = data.website_link || data.website || data.url || null;

    return (
        <AppLayout currentRoute="rooms">
            <SeoHead
                title={data.name}
                description={descriptionParagraphs[0] || data.location || ""}
                image={data.cover_image}
            />

            <section className="hd-wrap" aria-labelledby="hotel-title">
                <div className="hd-hero">
                    <div className="hd-hero-inner">
                        <img
                            src={data.cover_image}
                            alt={data.name}
                            className="hd-hero-bg"
                            loading="lazy"
                            decoding="async"
                        />
                        <div className="hd-hero-layout">
                            <div className="hd-hero-copy">
                                <p className="hd-eyebrow">
                                    {t("hotelDetail.eyebrow")} • Werrapark
                                    Resort
                                </p>
                                <h1 id="hotel-title" className="hd-title">
                                    {data.name}
                                </h1>
                                <p className="hd-location">
                                    <MapPin size={15} />
                                    {data.location}
                                </p>

                                <div className="hd-rating">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={18}
                                            className={
                                                i < Math.floor(data.stars)
                                                    ? "hd-star active"
                                                    : "hd-star"
                                            }
                                            aria-hidden
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="hd-hero-media" aria-hidden="true">
                                <div className="hd-hero-img-wrap">
                                    <span className="hd-hero-grad" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hd-layout">
                    <article className="hd-main">
                        {descriptionParagraphs.length > 0 ? (
                            <div className="hd-card hd-card--intro">
                                <h2 className="hd-card-title">
                                    <AlignLeft size={17} />
                                    {t("hotelDetail.descriptionTitle")}
                                </h2>
                                <div className="hd-description">
                                    {descriptionParagraphs.map(
                                        (paragraph, i) => (
                                            <p key={i}>{paragraph}</p>
                                        ),
                                    )}
                                </div>
                            </div>
                        ) : null}
                        <div className="hd-card">
                            <h2 className="hd-card-title">
                                <Sparkles size={17} />
                                {t("hotelDetail.amenities")}
                            </h2>
                            <div className="hd-chip-grid">
                                {amenities.map((item, i) => (
                                    <span className="hd-chip" key={i}>
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </article>

                    <aside
                        className="hd-aside"
                        aria-label={t("hotelDetail.requestTitle")}
                    >
                        <div className="hd-aside-card">
                            <h2 className="hd-aside-title">
                                {t("hotelDetail.requestTitle")}
                            </h2>
                            <p className="hd-aside-text">
                                {t("hotelDetail.requestText")}
                            </p>

                            <div className="hd-contact-info">
                                <a
                                    href={`mailto:${data.email}`}
                                    className="hd-contact-link"
                                >
                                    <Mail size={16} /> {data.email}
                                </a>
                                <a
                                    href={`tel:${data.phone}`}
                                    className="hd-contact-link"
                                >
                                    <Phone size={16} /> {data.phone}
                                </a>
                            </div>

                            <div className="hd-actions">
                                {websiteHref ? (
                                    <a
                                        href={websiteHref}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="hd-btn hd-btn--website"
                                    >
                                        <Globe size={16} />
                                        {t("hotelDetail.websiteBtn")}
                                    </a>
                                ) : null}
                                <a
                                    href={`/${locale}/kontakt`}
                                    className="hd-btn hd-btn--primary"
                                >
                                    {t("hotelDetail.contactBtn")}
                                </a>
                                <a
                                    href={`/${locale}`}
                                    className="hd-btn hd-btn--ghost"
                                >
                                    {t("hotelDetail.homeBtn")}
                                </a>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </AppLayout>
    );
}

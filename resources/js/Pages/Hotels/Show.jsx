import React from "react";
import { Head, usePage } from "@inertiajs/react";
import {
    CheckCircle2,
    MapPin,
    Mail,
    Phone,
    Star,
    Sparkles,
    Compass,
} from "lucide-react";
import AppLayout from "@/Layouts/AppLayout";
import { useTranslation } from "@/i18n";
import "@/../css/hotel-detail.css";

export default function HotelShow({ hotel: hotelId }) {
    const { props } = usePage();
    const { t } = useTranslation();

    // 1. Global hotels listesinden tıklanan oteli ID ile buluyoruz
    const hotelList = props.global?.hotels || [];
    const locale = props.global?.locale ?? "de";

    // URL'den gelen ID string olabilir, bu yüzden == kullanarak buluyoruz
    const data = hotelList.find((h) => h.id == hotelId);

    // Eğer otel bulunamazsa (veya sayfa yenilenirken henüz yüklenmediyse)
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

    // API'den gelmeyen ancak tasarımda olan listeler için güvenli fallbackler (varsayılanlar)
    const highlights = data.roomHighlights || [
        t("hotelDetail.defaultHighlight") || "Modernes Design",
    ];
    const amenities = data.services
        ? data.services.split(",")
        : data.amenities || ["WiFi", "TV", "Spa"];
    const activities = data.activities || [
        t("hotelDetail.defaultActivity") || "Wandern & Natur",
    ];

    return (
        <AppLayout currentRoute="rooms">
            <Head title={data.name} />

            <section className="hd-wrap" aria-labelledby="hotel-title">
                <div className="hd-hero">
                    <div className="hd-hero-inner">
                        {/* API'den gelen cover_image */}
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
                                {/* API'den gelen description'ı buraya basıyoruz */}
                                <p className="hd-intro">{data.description}</p>

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
                        <div className="hd-card">
                            <h2 className="hd-card-title">
                                {t("hotelDetail.roomHighlights")}
                            </h2>
                            <ul className="hd-list">
                                {highlights.map((item, i) => (
                                    <li key={i}>
                                        <CheckCircle2 size={16} />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="hd-card">
                            <h2 className="hd-card-title">
                                <Sparkles size={17} />
                                {t("hotelDetail.amenities")}
                            </h2>
                            <div className="hd-chip-grid">
                                {amenities.map((item, i) => (
                                    <span className="hd-chip" key={i}>
                                        {item.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="hd-card">
                            <h2 className="hd-card-title">
                                <Compass size={17} />
                                {t("hotelDetail.activities")}
                            </h2>
                            <ul className="hd-list">
                                {activities.map((item, i) => (
                                    <li key={i}>
                                        <CheckCircle2 size={16} />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
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

                            <p className="hd-ideal-for">
                                <strong>{t("hotelDetail.idealFor")}</strong>{" "}
                                {data.idealFor ||
                                    t("hotelDetail.defaultIdeal") ||
                                    "Familien & Paare"}
                            </p>

                            <div className="hd-actions">
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

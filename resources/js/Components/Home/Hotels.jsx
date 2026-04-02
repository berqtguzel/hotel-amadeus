import React from "react";
import "../../../css/hotels.css";
import { Link, usePage } from "@inertiajs/react";
import { Mail, Phone, Star } from "lucide-react";
import ElectricBorder from "../ReactBits/Animations/ElectricBorder";
import { useTranslation } from "@/i18n";

const slugifyHotel = (value = "") =>
    String(value)
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

export default function Hotels() {
    // 1. Global verileri Inertia props içinden çekiyoruz
    const { global } = usePage().props;

    // Verileri global nesnesinden ayıklıyoruz
    const hotelList = global?.hotels || [];
    const orderedHotels = [...hotelList].reverse();
    const locale = global?.locale ?? "de";
    const { t } = useTranslation();

    return (
        <section
            className="hotels-section relative overflow-hidden"
            aria-labelledby="hotels-heading"
        >
            <div className="hotels-background"></div>
            <div className="hotels-container relative z-20">
                <h2 id="hotels-heading" className="hotels-title">
                    {t("hotels.title")}
                </h2>
                <p className="hotels-subtitle" role="doc-subtitle">
                    {t("hotels.subtitle")}
                </p>

                <div className="hotel-grid">
                    {orderedHotels.length > 0 ? (
                        orderedHotels.map((hotel) => {
                            const hotelSlug =
                                hotel.slug ||
                                slugifyHotel(hotel.name) ||
                                hotel.id;

                            return (
                                <ElectricBorder
                                    key={hotel.slug || hotel.id || hotel.name}
                                    color={"var(--hotel-green)"}
                                    secondaryColor={"var(--hotel-green-light)"}
                                    borderRadius={16}
                                    borderWidth={2}
                                    glow={0.28}
                                    speed={1.0}
                                    hoverIntensity={1.0}
                                    className="hotel-eb"
                                >
                                    <div
                                        className="hotel-card eb-reset"
                                        role="article"
                                        aria-label={hotel.name}
                                    >
                                        <div className="hotel-image">
                                            <img
                                                src={hotel.cover_image}
                                                alt={hotel.name}
                                                loading="lazy"
                                            />
                                        </div>

                                        <div className="hotel-body">
                                            <h3>{hotel.name}</h3>

                                            <div className="hotel-rating">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={18}
                                                        className={
                                                            i <
                                                            Math.floor(
                                                                hotel.stars,
                                                            )
                                                                ? "hotel-star-filled "
                                                                : "hotel-star-empty"
                                                        }
                                                        aria-hidden
                                                    />
                                                ))}
                                            </div>

                                            <div className="hotel-contact">
                                                {hotel.email && (
                                                    <a
                                                        href={`mailto:${hotel.email}`}
                                                        className="hotel-link"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <Mail size={16} />{" "}
                                                        {hotel.email}
                                                    </a>
                                                )}
                                                {hotel.phone && (
                                                    <a
                                                        href={`tel:${hotel.phone}`}
                                                        className="hotel-link"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <Phone size={16} />{" "}
                                                        {hotel.phone}
                                                    </a>
                                                )}
                                            </div>

                                            <Link
                                                className="hotel-detail-btn"
                                                href={`/${locale}/hotels/${hotelSlug}`}
                                            >
                                                {t("hotels.cta")}
                                            </Link>
                                        </div>
                                    </div>
                                </ElectricBorder>
                            );
                        })
                    ) : (
                        /* Veri yoksa veya yükleniyorsa gösterilecek alan */
                        <p className="no-hotels">
                            {t("hotels.no_data") || "Keine Hotels gefunden."}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}

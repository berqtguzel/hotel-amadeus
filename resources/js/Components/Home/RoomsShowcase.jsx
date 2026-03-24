"use client";

import React from "react";
import { Link, usePage } from "@inertiajs/react";
import { FiCheck, FiMapPin, FiChevronRight } from "react-icons/fi";
import "../../../css/rooms-showcase.css";
import { ROOM_LIST } from "@/Data/RoomsData";
import { useTranslation } from "@/i18n";

const DotGrid = React.lazy(() =>
    import("../ReactBits/Backgrounds/DotGrid").then((m) => ({
        default: m.default || m,
    })),
);

function matchStaticSlug(apiRoom) {
    if (apiRoom.slug && ROOM_LIST.some((r) => r.id === apiRoom.slug)) {
        return apiRoom.slug;
    }
    const nameLC = (apiRoom.name ?? apiRoom.hotel_name ?? "").toLowerCase();
    const match = ROOM_LIST.find(
        (r) =>
            nameLC.includes(r.id) ||
            r.hotelName.toLowerCase().includes(nameLC.split(" ")[0]),
    );
    return match?.id ?? apiRoom.slug ?? String(apiRoom.id);
}

function normalizeApiRooms(apiRooms) {
    if (!apiRooms?.length) return null;
    return apiRooms.map((r) => {
        const slug = matchStaticSlug(r);
        return {
            id: slug,
            name: r.name ?? r.hotel_name ?? "",
            location: r.location ?? "",
            image: r.image ?? r.hero_image ?? "/images/template2.png",
            items: r.room_types ?? r.categories ?? [],
            cta: { slug },
        };
    });
}

function buildFallbackHotels() {
    return ROOM_LIST.map((r) => ({
        id: r.id,
        name: r.hotelName,
        location: r.location,
        image: r.heroImage,
        items: r.roomTypes,
        cta: { slug: r.id },
    }));
}

const Title = ({ children }) => <h2 className="rs-title">{children}</h2>;
const Eyebrow = ({ children }) => <div className="eyebrow">{children}</div>;

const HotelCard = ({ hotel, locale }) => {
    const { t } = useTranslation();
    const href = `/${locale}/rooms/${hotel.cta?.slug ?? hotel.id}`;

    return (
        <article className="rs-card" aria-labelledby={`h-${hotel.id}`}>
            {hotel.image && (
                <>
                    <img
                        className="rs-card__media"
                        src={hotel.image}
                        alt=""
                        aria-hidden="true"
                    />
                    <span className="rs-card__shade" aria-hidden="true" />
                </>
            )}

            <div className="rs-card__head">
                <div className="rs-card__meta">
                    <FiMapPin className="rs-icon" aria-hidden />
                    <span>{hotel.location}</span>
                </div>
                <h3 id={`h-${hotel.id}`} className="rs-card__title">
                    {hotel.name}
                </h3>
            </div>

            <ul className="rs-list">
                {(hotel.items || []).map((item, i) => (
                    <li key={i}>
                        <FiCheck className="rs-icon" aria-hidden />
                        <span>
                            {typeof item === "string"
                                ? item
                                : (item.name ?? item.label)}
                        </span>
                    </li>
                ))}
            </ul>

            <Link className="rs-cta" href={href}>
                {t("rooms.explore")}
                <FiChevronRight />
            </Link>
        </article>
    );
};

export default function RoomsShowcase() {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const { props } = usePage();
    const apiRooms = props?.rooms;
    const { t, locale } = useTranslation();

    const hotels = React.useMemo(() => {
        const fromApi = normalizeApiRooms(apiRooms);
        return fromApi ?? buildFallbackHotels();
    }, [apiRooms]);

    return (
        <section className="rs-wrap rs-with-bg" aria-labelledby="rooms-title">
            {mounted && (
                <React.Suspense fallback={null}>
                    <div
                        className="rs-dotgrid"
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 0,
                            pointerEvents: "none",
                            overflow: "hidden",
                        }}
                    >
                        <DotGrid
                            dotSize={12}
                            gap={80}
                            baseColor="#1f7008"
                            activeColor="#0E9B5B"
                            proximity={150}
                            speedTrigger={110}
                            shockRadius={260}
                            shockStrength={5}
                            maxSpeed={5200}
                            resistance={820}
                            returnDuration={1.3}
                        />
                    </div>
                </React.Suspense>
            )}

            <div className="rs-top">
                <Eyebrow>{t("rooms.eyebrow")}</Eyebrow>
                <Title id="rooms-title">{t("rooms.title")}</Title>
                <p className="rs-intro">{t("rooms.intro")}</p>
            </div>

            <div className="rs-grid">
                {hotels.map((h) => (
                    <HotelCard key={h.id} hotel={h} locale={locale} />
                ))}
            </div>
        </section>
    );
}

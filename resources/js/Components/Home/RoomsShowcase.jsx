"use client";

import React from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    FiCheck,
    FiUsers,
    FiCreditCard,
    FiChevronRight,
    FiLayers,
} from "react-icons/fi";
import "../../../css/rooms-showcase.css";
import { useTranslation } from "@/i18n";

function stripHtml(value = "") {
    return String(value)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function summarizeText(value = "", maxLength = 130) {
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

function RoomCard({ hotel, locale, t }) {
    const roomIdentifier = hotel.slug || slugifyRoom(hotel.name) || hotel.id;
    const href = `/${locale}/rooms/${roomIdentifier}`;
    const boardSummary = (hotel.boardTypes || [])
        .map((item) => item?.description ?? item?.name ?? item?.code)
        .filter(Boolean)
        .slice(0, 2);
    const featureSummary = (hotel.features || [])
        .map((item) => item?.name)
        .filter(Boolean)
        .slice(0, 3);
    const detailList = normalizeList(hotel.items).slice(0, 3);
    const cardSummary = summarizeText(hotel.description, 132);

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
        /* TASARIMI BOZMAMAK İÇİN:
           Article yerine Link kullanıyoruz, 'as="article"' ile CSS sınıflarını koruyoruz.
           textDecoration: 'none' ve color: 'inherit' ile linkin varsayılan mavi rengini engelliyoruz.
        */
        <Link
            href={href}
            className="rsm-card"
            as="article"
            aria-labelledby={`room-card-${hotel.id}`}
            style={{
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
            }}
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
                </div>
            </div>

            <div className="rsm-body">
                <div className="rsm-header-block">
                    <h3 id={`room-card-${hotel.id}`} className="rsm-title">
                        {hotel.name}
                    </h3>
                    {cardSummary ? (
                        <p className="rsm-desc">{cardSummary}</p>
                    ) : null}
                </div>

                {factItems.length ? (
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
                                    <strong>{fact.value}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

                {featureSummary.length ? (
                    <div className="rsm-chips">
                        {featureSummary.map((item, idx) => (
                            <span className="rsm-chip" key={idx}>
                                {item}
                            </span>
                        ))}
                    </div>
                ) : null}

                {detailList.length ? (
                    <ul className="rsm-points">
                        {detailList.map((item, idx) => (
                            <li key={idx}>
                                <FiCheck aria-hidden />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                ) : null}

                {/* Burada 'Link' yerine 'div' kullanıyoruz çünkü en dıştaki Link zaten tüm kartı kapsıyor.
                   Tasarım (rsm-cta sınıfı) aynı kalıyor.
                */}
                <div className="rsm-cta">
                    <span>{t("rooms.explore")}</span>
                    <FiChevronRight aria-hidden />
                </div>
            </div>
        </Link>
    );
}

export default function RoomsShowcase() {
    const { props } = usePage();
    const hotels = Array.isArray(props?.rooms) ? props.rooms : [];
    const { t, locale } = useTranslation();

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

                {hotels.length ? (
                    <div className="rsm-grid">
                        {hotels.map((hotel) => (
                            <RoomCard
                                key={hotel.id ?? hotel.slug}
                                hotel={hotel}
                                locale={locale}
                                t={t}
                            />
                        ))}
                    </div>
                ) : (
                    <article className="rsm-empty">
                        <h3>{t("rooms.emptyTitle")}</h3>
                        <p>{t("rooms.emptyText")}</p>
                    </article>
                )}
            </div>
        </section>
    );
}

"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "@/i18n";
import "../../../css/partners.css";

function PartnerSlider({
    titleId,
    eyebrow,
    title,
    items,
    linkItems = false,
    variant = "coverflow",
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const isHovering = useRef(false);
    const length = items.length;

    useEffect(() => {
        if (length === 0) return;

        setActiveIndex(Math.floor(length / 2));
    }, [length]);

    useEffect(() => {
        if (length === 0) return;

        const interval = setInterval(() => {
            if (!isHovering.current) {
                setActiveIndex((prev) => (prev + 1) % length);
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [length]);

    const getTransformClass = (index) => {
        if (length === 0) return "is-hidden";

        if (variant === "four" && length === 4) {
            const position = (index - activeIndex + length) % length;

            if (position === 0) return "is-active";
            if (position === 1) return "is-next-1";
            if (position === 2) return "is-next-2";
            if (position === 3) return "is-prev-1";
        }

        let dist = index - activeIndex;

        if (dist < -Math.floor(length / 2)) dist += length;
        if (dist > Math.floor(length / 2)) dist -= length;

        if (dist === 0) return "is-active";
        if (dist === -1) return "is-prev-1";
        if (dist === 1) return "is-next-1";
        if (dist === -2) return "is-prev-2";
        if (dist === 2) return "is-next-2";

        return "is-hidden";
    };

    if (length === 0) {
        return null;
    }

    const renderCardContent = (partner, partnerName, isReflection = false) => (
        <>
            <img
                src={partner.logo}
                alt={isReflection ? "" : partnerName}
                loading="lazy"
                onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextSibling.style.display = "block";
                }}
            />
            <span className="ptn-fallback-text" style={{ display: "none" }}>
                {partnerName}
            </span>
        </>
    );

    return (
        <section
            className={`ptn-section ptn-section--${variant}`}
            aria-labelledby={titleId}
        >
            <header className="ptn-header">
                <p className="ptn-eyebrow">{eyebrow}</p>
                <h2 id={titleId} className="ptn-heading">
                    {title}
                </h2>
            </header>

            <div
                className="ptn-slider-container"
                onMouseEnter={() => (isHovering.current = true)}
                onMouseLeave={() => (isHovering.current = false)}
                onTouchStart={() => (isHovering.current = true)}
                onTouchEnd={() => (isHovering.current = false)}
            >
                <div className="ptn-slider">
                    {items.map((partner, index) => {
                        const positionClass = getTransformClass(index);
                        const partnerName =
                            partner.name || partner.title || "Partner";
                        const canLink = linkItems && partner.website;
                        const CardTag = canLink ? "a" : "button";

                        return (
                            <div
                                key={partner.id || `${partner.slug}-${index}`}
                                className={`ptn-item ${positionClass}`}
                            >
                                <CardTag
                                    className="ptn-card-action"
                                    {...(canLink
                                        ? {
                                              href: partner.website,
                                              target: "_blank",
                                              rel: "noopener noreferrer",
                                              "aria-label": `${partnerName} website`,
                                          }
                                        : {
                                              type: "button",
                                              onClick: () =>
                                                  setActiveIndex(index),
                                              "aria-label": partnerName,
                                          })}
                                >
                                    <span className="ptn-card">
                                        {renderCardContent(
                                            partner,
                                            partnerName,
                                        )}
                                    </span>

                                    <span className="ptn-reflection">
                                        <span className="ptn-card">
                                            {renderCardContent(
                                                partner,
                                                partnerName,
                                                true,
                                            )}
                                        </span>
                                    </span>
                                </CardTag>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default function Partners() {
    const { i18n } = useTranslation();
    const locale = i18n?.language || "de";

    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                setLoading(true);
                const url = `/api/partners?locale=${locale}`;
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                const textData = await response.text();
                const responseData = textData ? JSON.parse(textData) : {};
                const partnersArray = Array.isArray(responseData)
                    ? responseData
                    : responseData?.partners || responseData?.data || [];

                setPartners(partnersArray);
            } catch (error) {
                console.error("Partner data could not be loaded:", error);
                setPartners([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPartners();
    }, [locale]);

    const partnerHotels = useMemo(
        () => partners.filter((partner) => partner.type === "partner_hotel"),
        [partners],
    );
    const unserPartners = useMemo(
        () => partners.filter((partner) => partner.type === "unser_partner"),
        [partners],
    );

    if (loading) {
        return (
            <section className="ptn-wrap">
                <div className="flex justify-center items-center min-h-[300px]">
                    <span className="text-white/50 animate-pulse">
                        Partnerler yükleniyor...
                    </span>
                </div>
            </section>
        );
    }

    if (partnerHotels.length === 0 && unserPartners.length === 0) {
        return null;
    }

    return (
        <section className="ptn-wrap">
            <PartnerSlider
                titleId="partner-hotels-title"
                eyebrow="PARTNER HOTELS"
                title="Partner Hotels"
                items={partnerHotels}
                linkItems
            />

            <PartnerSlider
                titleId="partners-title"
                eyebrow="UNSER PARTNER"
                title="Unser Partner"
                items={unserPartners}
                variant="four"
            />
        </section>
    );
}

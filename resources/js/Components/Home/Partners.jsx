"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/i18n";
import "../../../css/partners.css";

export default function Partners() {
    const { t, i18n } = useTranslation();
    const locale = i18n?.language || "de";

    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    const isHovering = useRef(false);
    const length = partners.length;

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                setLoading(true);
                const url = `/api/partners?locale=${locale}`;
                console.log("1. İstek atılıyor:", url);

                const response = await fetch(url);
                console.log("2. HTTP Durum Kodu:", response.status);

                if (!response.ok) {
                    throw new Error(`HTTP Hatası: ${response.status}`);
                }

                const textData = await response.text();
                console.log("3. Gelen Ham Veri (Text):", textData);

                const responseData = textData ? JSON.parse(textData) : {};
                console.log("4. JSON Olarak Parse Edilen Veri:", responseData);

                const partnersArray =
                    responseData?.partners || responseData?.data || [];

                console.log("5. Ekrana Basılacak Array:", partnersArray);

                setPartners(partnersArray);

                if (partnersArray.length > 0) {
                    setActiveIndex(Math.floor(partnersArray.length / 2));
                }
            } catch (error) {
                console.error("6. Yakalanan Hata:", error);
                setPartners([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPartners();
    }, [locale]);

    useEffect(() => {
        if (length === 0) return;

        const interval = setInterval(() => {
            if (!isHovering.current) {
                setActiveIndex((prev) => (prev + 1) % length);
            }
        }, 4000);
        return () => clearInterval(interval);
    }, [length]);

    console.log("Aktif Partner:", partners[activeIndex]);
    const handleItemClick = (index) => {
        setActiveIndex(index);
    };

    const getTransformClass = (index) => {
        if (length === 0) return "is-hidden";
        let dist = index - activeIndex;

        // Sınırsız döngü mantığı
        if (dist < -Math.floor(length / 2)) dist += length;
        if (dist > Math.floor(length / 2)) dist -= length;

        if (dist === 0) return "is-active";
        if (dist === -1) return "is-prev-1";
        if (dist === 1) return "is-next-1";
        if (dist === -2) return "is-prev-2";
        if (dist === 2) return "is-next-2";
        return "is-hidden";
    };

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

    if (length === 0) {
        return null;
    }

    return (
        <section className="ptn-wrap" aria-labelledby="partners-title">
            <header className="ptn-header">
                <p className="ptn-eyebrow">PARTNER & PARTNER HOTELS</p>
                <h2 id="partners-title" className="ptn-heading">
                    Unser Partner
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
                    {partners.map((partner, index) => {
                        const positionClass = getTransformClass(index);
                        const partnerName =
                            partner.name || partner.title || "Partner";

                        return (
                            <div
                                key={partner.id || index}
                                className={`ptn-item ${positionClass}`}
                                onClick={() => handleItemClick(index)}
                            >
                                <div className="ptn-card">
                                    <img
                                        src={partner.logo}
                                        alt={partnerName}
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                            e.target.nextSibling.style.display =
                                                "block";
                                        }}
                                    />
                                    <span
                                        className="ptn-fallback-text"
                                        style={{ display: "none" }}
                                    >
                                        {partnerName}
                                    </span>
                                </div>

                                {/* Alt Yansıma (Reflection) */}
                                <div className="ptn-reflection">
                                    <div className="ptn-card">
                                        <img
                                            src={partner.logo}
                                            alt=""
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                                e.target.nextSibling.style.display =
                                                    "block";
                                            }}
                                        />
                                        <span
                                            className="ptn-fallback-text"
                                            style={{ display: "none" }}
                                        >
                                            {partnerName}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

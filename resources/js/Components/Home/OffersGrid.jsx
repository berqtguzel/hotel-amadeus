import React, {
    useMemo,
    useEffect,
    useState,
    useRef,
    useCallback,
} from "react";
import { Link, usePage } from "@inertiajs/react";
import FlowingMenu from "../ReactBits/Components/FlowingMenu";
import Cubes from "../ReactBits/Backgrounds/Cubes";
import "../../../css/offers-grid.css";
import OFFERS from "@/Data/OffersData";
import { useTranslation } from "@/i18n";

function useReveal(threshold = 0.15) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    io.disconnect();
                }
            },
            { threshold },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [threshold]);

    return [ref, visible];
}

const OffersGrid = () => {
    const items = useMemo(
        () =>
            OFFERS.map((o) => ({
                link: o.href || "#",
                text: o.subtitle ? `${o.title} — ${o.subtitle}` : o.title,
                image: o.image,
            })),
        [],
    );

    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
        const check = () =>
            setIsDark(
                document.documentElement.classList.contains("dark") ||
                    (mq ? mq.matches : false),
            );
        check();
        mq && mq.addEventListener?.("change", check);
        const obs = new MutationObserver(check);
        obs.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });
        return () => {
            mq && mq.removeEventListener?.("change", check);
            obs.disconnect();
        };
    }, []);

    const ribbonColors = isDark
        ? ["#8EE7C8", "#67C9A8", "#9FE5C7"]
        : ["#1B5E4A", "#2F7D68", "#9AD7C2"];

    const { props } = usePage();
    const locale = props?.locale ?? "de";
    const { t } = useTranslation();

    const [headRef, headVisible] = useReveal(0.12);
    const [gridRef, gridVisible] = useReveal(0.06);

    return (
        <section className="og-wrap">
            <div className="og-background"></div>
            <header
                ref={headRef}
                className={`og-head ${headVisible ? "og-revealed" : "og-hidden"}`}
            >
                <div className="eyebrow">{t("offers.eyebrow")}</div>
                <h2 className="og-title">{t("offers.title")}</h2>
                <p className="og-subtitle">{t("offers.subtitle")}</p>
            </header>

            <div
                ref={gridRef}
                className={`og-grid ${gridVisible ? "og-revealed" : "og-hidden"}`}
            >
                {OFFERS?.length ? (
                    OFFERS.map((o, idx) => (
                        <article
                            className="og-card og-card-anim"
                            key={o.id || idx}
                            style={{ "--card-i": idx }}
                        >
                            <Link
                                className="og-card-media"
                                href={`/${locale}/offers/${o.id}`}
                                aria-label={o.title}
                            >
                                <img
                                    src={o.image}
                                    alt={o.title}
                                    loading="lazy"
                                    className="og-img"
                                />
                                <div className="og-media-overlay" />
                                {o.tag && (
                                    <span className="og-badge">{o.tag}</span>
                                )}
                                <button
                                    className="og-fav"
                                    type="button"
                                    aria-label={t("offers.addFavorite")}
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.7A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </button>
                            </Link>
                            <div className="og-card-body">
                                <h3 className="og-card-title">{o.title}</h3>
                                {o.subtitle && (
                                    <p className="og-card-sub">{o.subtitle}</p>
                                )}
                                <div className="og-meta">
                                    {o.duration && (
                                        <span className="og-chip">
                                            {o.duration}
                                        </span>
                                    )}
                                    {o.location && (
                                        <span className="og-chip">
                                            {o.location}
                                        </span>
                                    )}
                                </div>
                                {o.price && (
                                    <div className="og-price-row">
                                        <span className="og-price">
                                            {o.price}
                                        </span>
                                        {o.oldPrice && (
                                            <span className="og-old-price">
                                                {o.oldPrice}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div className="og-actions">
                                    <Link
                                        className="og-btn"
                                        href={`/${locale}/offers/${o.id}`}
                                    >
                                        {t("offers.viewDetails")}
                                    </Link>
                                    {o.cta && (
                                        <Link
                                            className="og-btn og-btn--ghost"
                                            href={`/${locale}/offers/${o.id}`}
                                        >
                                            {o.cta}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))
                ) : (
                    <div className="og-empty">
                        <div className="og-skeleton-card" />
                        <div className="og-skeleton-card" />
                        <div className="og-skeleton-card" />
                        <div className="og-skeleton-card" />
                    </div>
                )}
            </div>
        </section>
    );
};

export default OffersGrid;

import React, { useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/i18n";
import { ensureLocaleInUrl } from "@/utils/url";
import {
    filterLegalItems,
    deduplicateByUrl,
    ensureTreeNoDuplicates,
} from "@/utils/menuUtils";
import "../../css/header.css";
const sendTracking = async (payload) => {
    const csrfToken =
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ?? "";

    try {
        await fetch("/track-button", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRF-TOKEN": csrfToken,
            },
            body: JSON.stringify({
                event: "button_click",
                button_id: payload.button_id,
                button_label: payload.button_label,
                button_name: "header_cta",
                page: window.location.href,
                url: window.location.href,
                metadata: payload.metadata ?? {},
            }),
        });
    } catch (e) {
        console.error("Tracking error:", e);
    }
};

function resolveMenuText(value, locale) {
    if (typeof value === "string") return value.trim();
    if (!value || typeof value !== "object") return "";

    const localized =
        value[locale] ??
        value[locale?.toLowerCase?.()] ??
        value.de ??
        value.en ??
        value.tr ??
        value.label ??
        value.title ??
        value.name;

    return typeof localized === "string" ? localized.trim() : "";
}

function fallbackMenuText(item, locale) {
    const slugSource =
        item?.slug ?? item?.key ?? item?.url ?? item?.path ?? item?.href ?? "";

    const normalized = String(slugSource)
        .split("/")
        .filter(Boolean)
        .pop()
        ?.replace(/[-_]+/g, " ")
        ?.trim();

    if (!normalized) {
        return locale === "tr" ? "Menu" : "Menu";
    }

    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildNavFromApi(apiMenu, locale) {
    const menuList = Array.isArray(apiMenu)
        ? apiMenu
        : Array.isArray(apiMenu?.data)
          ? apiMenu.data
          : Array.isArray(apiMenu?.items)
            ? apiMenu.items
            : apiMenu
              ? [apiMenu]
              : [];

    if (!menuList.length) return null;

    const headerMenu =
        menuList.find(
            (m) =>
                m.location === "header" ||
                m.type === "header" ||
                m.slug === "header",
        ) ?? menuList[0];

    let items = headerMenu?.items ?? headerMenu?.children ?? [];
    if (!items.length) return null;

    items = ensureTreeNoDuplicates(items);
    if (!items.length) return null;

    const result = items.map((item) => {
        const rawUrl = item.url?.startsWith("http")
            ? item.url
            : item.url?.startsWith("/")
              ? item.url
              : `/${locale}/${item.slug ?? item.url ?? ""}`;
        const url = ensureLocaleInUrl(rawUrl, locale);
        const itemName =
            resolveMenuText(item.name, locale) ||
            resolveMenuText(item.title, locale) ||
            resolveMenuText(item.label, locale) ||
            fallbackMenuText(item, locale);

        const entry = {
            name: itemName,
            url,
            key: item.slug ?? item.key ?? "",
        };

        if (item.children?.length || item.items?.length) {
            entry.children = (item.children ?? item.items).map((child) => {
                const childRaw = child.url?.startsWith("http")
                    ? child.url
                    : child.url?.startsWith("/")
                      ? child.url
                      : `/${locale}/${child.slug ?? child.url ?? ""}`;

                const childName =
                    resolveMenuText(child.name, locale) ||
                    resolveMenuText(child.title, locale) ||
                    resolveMenuText(child.label, locale) ||
                    fallbackMenuText(child, locale);

                return {
                    name: childName,
                    url: ensureLocaleInUrl(childRaw, locale),
                    key: child.slug ?? child.key ?? "",
                };
            });
        }

        return entry;
    });

    const filtered = filterLegalItems(result);
    const deduped = deduplicateByUrl(filtered);
    return deduped.length ? deduped : null;
}

const DEFAULT_LOGO_LIGHT = "/images/Logo/Hotel Amadeus-logo-white.png";
const DEFAULT_LOGO_DARK = "/images/Logo/Hotel Amadeus-logo.png";

export default function Header({ currentRoute }) {
    const { props } = usePage();
    const { t } = useTranslation();
    const locale = props?.locale ?? "de";
    const apiMenu = props?.global?.menu;
    const branding = props?.global?.settings?.branding ?? {};
    const contact = props?.global?.settings?.contact ?? {};
    const [scrolled, setScrolled] = React.useState(false);

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (ticking) return;

            ticking = true;

            window.requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    setScrolled((current) => (current ? current : true));
                } else {
                    setScrolled((current) => (current ? false : current));
                }

                ticking = false;
            });
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            ticking = false;
        };
    }, []);

    const logoLight =
        branding.logo_light ??
        branding.light_logo ??
        branding.logo ??
        DEFAULT_LOGO_LIGHT;
    const logoDark =
        branding.logo_dark ??
        branding.dark_logo ??
        branding.darklogo ??
        branding.logo ??
        DEFAULT_LOGO_DARK;

    const contactEmail = contact.email ?? contact.mail ?? "";
    const contactPhone =
        contact.phone ?? contact.tel ?? contact.telephone ?? "";

    const [open, setOpen] = React.useState(false);
    const [mobileSub, setMobileSub] = React.useState(null);
    const navRowRef = React.useRef(null);
    const navFitWrapRef = React.useRef(null);
    const navDesktopRef = React.useRef(null);
    const [navFontPx, setNavFontPx] = React.useState(12);

    React.useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => (document.body.style.overflow = "");
    }, [open]);

    const navFromApi = React.useMemo(
        () => buildNavFromApi(apiMenu, locale),
        [apiMenu, locale],
    );

    const desktopNav = navFromApi ?? [];
    const mobileNav = navFromApi ?? [];
    const restaraunt = t("header.restaurant");
    const bestPriceLabel = t("header.bestPriceBooking");

    useEffect(() => {
        const row = navRowRef.current;
        const wrap = navFitWrapRef.current;
        const nav = navDesktopRef.current;
        if (!row || !wrap || !nav || desktopNav.length === 0) {
            setNavFontPx(12);
            return;
        }

        const fit = () => {
            const desktopMq = window.matchMedia("(min-width: 1200px)");
            if (!desktopMq.matches) {
                setNavFontPx(12);
                return;
            }

            const brand = row.querySelector(".wh-brand");
            const ctas = row.querySelector(".wh-nav-ctas");
            const cs = getComputedStyle(row);
            const gapPx = parseFloat(cs.gap) || 0;
            /* Grid: logo | nav | CTA — iki aralık; CTA genişliği ölçülemezse taşma olur */
            const reserved = 44;
            let cw =
                row.clientWidth -
                (brand?.offsetWidth ?? 0) -
                (ctas?.offsetWidth ?? 0) -
                2 * gapPx -
                reserved;
            cw = Math.max(32, Math.floor(cw));

            if (cw < 40) {
                setNavFontPx(12);
                return;
            }

            const pad = 6;

            const maxFs = 14;
            const minFs = 9;
            let lo = minFs;
            let hi = maxFs;
            let best = minFs;

            for (let i = 0; i < 30; i++) {
                const mid = (lo + hi) / 2;
                nav.style.fontSize = `${mid}px`;
                const sw = nav.scrollWidth;
                if (sw <= cw - pad) {
                    best = mid;
                    lo = mid;
                } else {
                    hi = mid;
                }
                if (hi - lo < 0.09) break;
            }

            nav.style.fontSize = `${best}px`;
            let guard = 0;
            while (
                nav.scrollWidth > cw - pad + 1 &&
                best > 5.85 &&
                guard < 64
            ) {
                best -= 0.1;
                nav.style.fontSize = `${best}px`;
                guard += 1;
            }

            nav.style.fontSize = "";
            setNavFontPx(Math.round(best * 100) / 100);
        };

        fit();

        const ro = new ResizeObserver(() => requestAnimationFrame(fit));
        ro.observe(row);
        ro.observe(wrap);

        const mq = window.matchMedia("(min-width: 1200px)");
        const onMq = () => requestAnimationFrame(fit);
        mq.addEventListener("change", onMq);

        return () => {
            ro.disconnect();
            mq.removeEventListener("change", onMq);
        };
    }, [apiMenu, locale, navFromApi]);

    return (
        <header
            className={`wh-header ${scrolled ? "is-scrolled" : "is-transparent"}`}
        >
            <div className="wh-topbar">
                <div className="wh-container wh-topbar__inner">
                    <div className="wh-topbar__left">
                        {contactEmail ? (
                            <a
                                href={`mailto:${contactEmail}`}
                                className="wh-toplink"
                            >
                                {contactEmail}
                            </a>
                        ) : null}

                        {contactPhone ? (
                            <a
                                href={`tel:${contactPhone.replace(/\s/g, "")}`}
                                className="wh-toplink"
                            >
                                {contactPhone}
                            </a>
                        ) : null}
                    </div>
                    <div className="wh-topbar__right">
                        <LanguageSwitcher locale={locale} />
                        <ThemeToggle />
                    </div>
                </div>
            </div>

            <div className="wh-navwrap">
                <div className="wh-container wh-nav__inner" ref={navRowRef}>
                    <Link href="/" className="wh-brand">
                        <img
                            src={logoLight}
                            alt={
                                branding.site_name ??
                                branding.siteName ??
                                "Logo"
                            }
                            className="wh-brand__logo wh-brand__logo--light"
                        />

                        <img
                            src={logoDark}
                            alt={
                                branding.site_name ??
                                branding.siteName ??
                                "Logo"
                            }
                            className="wh-brand__logo wh-brand__logo--dark"
                        />
                    </Link>

                    <div className="wh-nav-fit-wrap" ref={navFitWrapRef}>
                        <nav
                            className="wh-nav-desktop"
                            ref={navDesktopRef}
                            style={{ fontSize: `${navFontPx}px` }}
                            aria-label="Main navigation"
                        >
                            {desktopNav.map((n, i) => {
                                const hasChildren = n.children?.length;

                                return (
                                    <div key={i} className="wh-nav-item">
                                        <Link
                                            href={n.url}
                                            className={`wh-link ${currentRoute === n.key ? "is-active" : ""}`}
                                        >
                                            <span className="wh-link__label">
                                                {n.name}
                                            </span>

                                            {hasChildren && (
                                                <span className="wh-arrow">
                                                    ▾
                                                </span>
                                            )}
                                        </Link>

                                        {hasChildren && (
                                            <div className="wh-dropdown">
                                                {n.children.map((c, j) => (
                                                    <Link
                                                        key={j}
                                                        href={c.url}
                                                        className="wh-dropdown-link"
                                                    >
                                                        {c.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="wh-nav-ctas wh-ctas-desktop">
                        <a
                            href="https://www.secure-hotel-booking.com/d-edge/Hotel-Amadeus-Dresden-Neustadt/J1FA/de-DE/DateSelection?invalidateEngineCache=true&_gl=1*1tzxwy6*_gcl_au*ODU1OTg2NjA1LjE3NzYwNjQzNDA."
                            className="wh-btn wh-btn--light"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                                e.preventDefault();

                                sendTracking({
                                    button_id: "header_gruppenbuchung",
                                    button_label: restaraunt,
                                    metadata: { location: "header" },
                                });

                                window.open(
                                    "https://www.secure-hotel-booking.com/d-edge/Hotel-Amadeus-Dresden-Neustadt/J1FA/de-DE/DateSelection?invalidateEngineCache=true&_gl=1*1tzxwy6*_gcl_au*ODU1OTg2NjA1LjE3NzYwNjQzNDA.",
                                    "_blank",
                                );
                            }}
                        >
                            {restaraunt}
                        </a>

                        <a
                            href="https://www.secure-hotel-booking.com/d-edge/Hotel-Amadeus-Dresden-Neustadt/J1FA/de-DE/DateSelection?invalidateEngineCache=true&_gl=1*lc3xdg*_gcl_au*ODU1OTg2NjA1LjE3NzYwNjQzNDA."
                            className="wh-btn wh-btn--light"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                                e.preventDefault();

                                sendTracking({
                                    button_id: "header_bestpreis",
                                    button_label: bestPriceLabel,
                                    metadata: { location: "header" },
                                });

                                window.open(
                                    "https://www.secure-hotel-booking.com/d-edge/Hotel-Amadeus-Dresden-Neustadt/J1FA/de-DE/DateSelection?invalidateEngineCache=true&_gl=1*lc3xdg*_gcl_au*ODU1OTg2NjA1LjE3NzYwNjQzNDA.",
                                    "_blank",
                                );
                            }}
                        >
                            {bestPriceLabel}
                        </a>
                    </div>
                    <button
                        type="button"
                        className="wh-hamburger"
                        onClick={() => setOpen(true)}
                        aria-label="Menu"
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>
            </div>

            <div className={`wh-drawer ${open ? "is-open" : ""}`}>
                <button
                    type="button"
                    className="wh-drawer__backdrop"
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                />

                <aside className="wh-drawer__panel">
                    <div className="wh-drawer__head">
                        <Link
                            href="/"
                            onClick={() => setOpen(false)}
                            className="wh-brand"
                        >
                            <img
                                src={logoLight}
                                alt={
                                    branding.site_name ??
                                    branding.siteName ??
                                    "Logo"
                                }
                                className="wh-brand__logo wh-brand__logo--light"
                            />

                            <img
                                src={logoDark}
                                alt={
                                    branding.site_name ??
                                    branding.siteName ??
                                    "Logo"
                                }
                                className="wh-brand__logo wh-brand__logo--dark"
                            />
                        </Link>

                        <button
                            type="button"
                            className="wh-close"
                            onClick={() => setOpen(false)}
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>

                    <div className="wh-drawer__body">
                        <nav className="wh-m-nav" aria-label="Mobil menü">
                            {mobileNav.map((n, i) => {
                                const hasChildren = n.children?.length;

                                return (
                                    <div key={i} className="wh-m-item">
                                        {hasChildren ? (
                                            <button
                                                type="button"
                                                className="wh-m-link"
                                                aria-expanded={mobileSub === i}
                                                onClick={() =>
                                                    setMobileSub(
                                                        mobileSub === i
                                                            ? null
                                                            : i,
                                                    )
                                                }
                                            >
                                                <span>{n.name}</span>
                                                <span
                                                    className={`wh-m-chevron ${mobileSub === i ? "is-open" : ""}`}
                                                    aria-hidden
                                                >
                                                    ▾
                                                </span>
                                            </button>
                                        ) : (
                                            <Link
                                                href={n.url}
                                                className="wh-m-link wh-m-link--leaf"
                                                onClick={() => setOpen(false)}
                                            >
                                                <span>{n.name}</span>
                                            </Link>
                                        )}

                                        {hasChildren && mobileSub === i && (
                                            <div className="wh-m-sub">
                                                {n.children.map((c, j) => (
                                                    <Link
                                                        key={j}
                                                        href={c.url}
                                                        className="wh-m-sublink"
                                                        onClick={() =>
                                                            setOpen(false)
                                                        }
                                                    >
                                                        {c.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>
                        <div className="wh-m-ctas">
                            <div className="wh-m-lang">
                                <LanguageSwitcher locale={locale} />
                            </div>
                            <a
                                href="https://bookings.tripmakery.com/de/h/brV2ODN9RoGB?p=1&s=INTERNAL_RATING&a=0&c=0"
                                className="wh-btn wh-btn--light wh-btn--block"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                    e.preventDefault();

                                    sendTracking({
                                        button_id: "mobile_gruppenbuchung",
                                        button_label: restaraunt,
                                        metadata: { location: "mobile" },
                                    });

                                    setOpen(false);

                                    window.open(
                                        "https://bookings.tripmakery.com/de/h/brV2ODN9RoGB?p=1&s=INTERNAL_RATING&a=0&c=0",
                                        "_blank",
                                    );
                                }}
                            >
                                {restaraunt}
                            </a>

                            <a
                                href="https://www.secure-hotel-booking.com/d-edge/Hotel Amadeus-Hotels-Masserberg-GmbH-Co-KG/JKR8/tr-TR/HotelSelection?_gl=1*1b09wi9*_gcl_au*MTUzMDE3MDYyMy4xNzY2NjQ3NjY1"
                                className="wh-btn wh-btn--primary wh-btn--block"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                    e.preventDefault();

                                    sendTracking({
                                        button_id: "mobile_bestpreis",
                                        button_label: bestPriceLabel,
                                        metadata: { location: "mobile" },
                                    });

                                    setOpen(false);

                                    window.open(
                                        "https://www.secure-hotel-booking.com/d-edge/Hotel Amadeus-Hotels-Masserberg-GmbH-Co-KG/JKR8/tr-TR/HotelSelection?_gl=1*1b09wi9*_gcl_au*MTUzMDE3MDYyMy4xNzY2NjQ3NjY1",
                                        "_blank",
                                    );
                                }}
                            >
                                {bestPriceLabel}
                            </a>

                            <div className="wh-m-contact-block">
                                {contactEmail ? (
                                    <a
                                        href={`mailto:${contactEmail}`}
                                        className="wh-m-contact-link"
                                    >
                                        {contactEmail}
                                    </a>
                                ) : null}

                                {contactPhone ? (
                                    <a
                                        href={`tel:${contactPhone.replace(/\s/g, "")}`}
                                        className="wh-m-contact-link"
                                    >
                                        {contactPhone}
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </header>
    );
}

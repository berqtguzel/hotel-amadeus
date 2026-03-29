import React from "react";
import { Link, usePage } from "@inertiajs/react";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { ensureLocaleInUrl } from "@/utils/url";
import {
    filterLegalItems,
    deduplicateByUrl,
    ensureTreeNoDuplicates,
} from "@/utils/menuUtils";
import "../../css/header.css";

function buildNavFromApi(apiMenu, locale) {
    if (!Array.isArray(apiMenu) || !apiMenu.length) return null;

    const headerMenu =
        apiMenu.find(
            (m) =>
                m.location === "header" ||
                m.type === "header" ||
                m.slug === "header",
        ) ?? apiMenu[0];

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

        const entry = {
            name: item.name ?? item.title ?? "",
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
                return {
                    name: child.name ?? child.title ?? "",
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

const DEFAULT_LOGO_LIGHT = "/images/Logo/werrapark-logo-white.png";
const DEFAULT_LOGO_DARK = "/images/Logo/werrapark-logo.png";

export default function Header({ currentRoute }) {
    const { props } = usePage();
    const locale = props?.locale ?? "de";
    const apiMenu = props?.global?.menu;
    const branding = props?.global?.settings?.branding ?? {};
    const contact = props?.global?.settings?.contact ?? {};

    console.log("Header props:", props);
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

    const contactEmail = contact.email ?? contact.mail ?? "info@werrapark.de";
    const contactPhone =
        contact.phone ?? contact.tel ?? contact.telephone ?? "+4936874205706";

    const [open, setOpen] = React.useState(false);
    const [mobileSub, setMobileSub] = React.useState(null);

    React.useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => (document.body.style.overflow = "");
    }, [open]);

    const fallbackNav = [
        {
            name: "Home",
            url: locale === "de" ? "/" : `/${locale}`,
            key: "home",
        },
        { name: "Über uns", url: `/${locale}/uber-uns`, key: "uberuns" },
        { name: "Galerie", url: `/${locale}/galerie`, key: "galerie" },
        { name: "Karriere", url: `/${locale}/karriere`, key: "karriere" },
    ];

    const navFromApi = React.useMemo(
        () => buildNavFromApi(apiMenu, locale),
        [apiMenu, locale],
    );

    const desktopNav = navFromApi ?? fallbackNav;
    const mobileNav = navFromApi ?? fallbackNav;

    return (
        <header className="wh-header">
            <div className="wh-topbar">
                <div className="wh-container wh-topbar__inner">
                    <div className="wh-topbar__left">
                        <a
                            href={`mailto:${contactEmail}`}
                            className="wh-toplink"
                        >
                            {contactEmail}
                        </a>

                        <a
                            href={`tel:${contactPhone.replace(/\s/g, "")}`}
                            className="wh-toplink"
                        >
                            {contactPhone}
                        </a>
                    </div>
                    <div className="wh-topbar__right">
                        <LanguageSwitcher locale={locale} />
                        <ThemeToggle />
                    </div>
                </div>
            </div>

            <div className="wh-navwrap">
                <div className="wh-container wh-nav__inner">
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

                    <nav className="wh-nav-desktop">
                        {desktopNav.map((n, i) => {
                            const hasChildren = n.children?.length;

                            return (
                                <div key={i} className="wh-nav-item">
                                    <Link
                                        href={n.url}
                                        className={`wh-link ${currentRoute === n.key ? "is-active" : ""}`}
                                    >
                                        {n.name}

                                        {hasChildren && (
                                            <span className="wh-arrow">▾</span>
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

                    <div className="wh-nav-ctas wh-ctas-desktop">
                        <a
                            href={`/track?${new URLSearchParams({
                                redirect:
                                    "https://bookings.tripmakery.com/de/h/brV2ODN9RoGB?p=1&s=INTERNAL_RATING&a=0&c=0",
                                button_id: "header-gruppenbuchung",
                                button_label: "Gruppenbuchung",
                            }).toString()}`}
                            className="wh-btn wh-btn--light"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Gruppenbuchung
                        </a>
                        <a
                            href={`/track?${new URLSearchParams({
                                redirect:
                                    "https://www.secure-hotel-booking.com/d-edge/Werrapark-Hotels-Masserberg-GmbH-Co-KG/JKR8/tr-TR?_gl=1*1b09wi9*_gcl_au*MTUzMDE3MDYyMy4xNzY2NjQ3NjY1",
                                button_id: "header-bestpreis",
                                button_label: "Bestpreis buchen",
                            }).toString()}`}
                            className="wh-btn wh-btn--light"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Bestpreis buchen
                        </a>
                    </div>
                    <button
                        className="wh-hamburger"
                        onClick={() => setOpen(true)}
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>
            </div>

            <div className={`wh-drawer ${open ? "is-open" : ""}`}>
                <button
                    className="wh-drawer__backdrop"
                    onClick={() => setOpen(false)}
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
                                src={logoLight}
                                alt={
                                    branding.site_name ??
                                    branding.siteName ??
                                    "Logo"
                                }
                                className="wh-brand__logo wh-brand__logo--dark"
                            />
                        </Link>

                        <button
                            className="wh-close"
                            onClick={() => setOpen(false)}
                        >
                            ×
                        </button>
                    </div>

                    <div className="wh-drawer__body">
                        {mobileNav.map((n, i) => {
                            const hasChildren = n.children?.length;

                            return (
                                <div key={i}>
                                    <button
                                        className="wh-m-link"
                                        onClick={() =>
                                            hasChildren
                                                ? setMobileSub(
                                                      mobileSub === i
                                                          ? null
                                                          : i,
                                                  )
                                                : setOpen(false)
                                        }
                                    >
                                        {n.name}

                                        {hasChildren && <span>▾</span>}
                                    </button>

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
                        <div className="wh-m-ctas">
                            <LanguageSwitcher locale={locale} />
                            <a
                                href={`/track?${new URLSearchParams({
                                    redirect:
                                        "https://bookings.tripmakery.com/de/h/brV2ODN9RoGB?p=1&s=INTERNAL_RATING&a=0&c=0",
                                    button_id: "mobile-gruppenbuchung",
                                    button_label: "Gruppenbuchung",
                                }).toString()}`}
                                className="wh-btn wh-btn--light wh-btn--block"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpen(false)}
                            >
                                Gruppenbuchung
                            </a>

                            <a
                                href={`/track?${new URLSearchParams({
                                    redirect:
                                        "https://www.secure-hotel-booking.com/d-edge/Werrapark-Hotels-Masserberg-GmbH-Co-KG/JKR8/tr-TR/HotelSelection?_gl=1*1b09wi9*_gcl_au*MTUzMDE3MDYyMy4xNzY2NjQ3NjY1",
                                    button_id: "mobile-bestpreis",
                                    button_label: "Bestpreis buchen",
                                }).toString()}`}
                                className="wh-btn wh-btn--primary wh-btn--block"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpen(false)}
                            >
                                Bestpreis buchen
                            </a>

                            <div className="wh-topbar__left">
                                <a
                                    href={`mailto:${contactEmail}`}
                                    className="wh-toplink"
                                >
                                    {contactEmail}
                                </a>

                                <a
                                    href={`tel:${contactPhone.replace(/\s/g, "")}`}
                                    className="wh-toplink"
                                >
                                    {contactPhone}
                                </a>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </header>
    );
}

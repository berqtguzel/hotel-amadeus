import React, { useMemo } from "react";
import { usePage } from "@inertiajs/react";
import { useTranslation } from "@/i18n";
import { ensureLocaleInUrl } from "@/utils/url";

import { Facebook, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";

import "../../css/Footer.css";

const TREE_IMG = "/images/Logo/tree.png";

const TREE_LAYERS = [
    { key: "a", className: "wh-tree wh-tree--a", alt: "" },
    { key: "b", className: "wh-tree wh-tree--b", alt: "" },
    { key: "c", className: "wh-tree wh-tree--c", alt: "" },
    { key: "d", className: "wh-tree wh-tree--d", alt: "" },
];

const LEAVES = [
    {
        id: 1,
        style: {
            "--leaf-left": "6%",
            "--leaf-size": "9px",
            "--leaf-duration": "11.2s",
            "--leaf-delay": "0s",
            "--leaf-rotation": "1.05",
            "--leaf-drift": "-22px",
        },
    },
    {
        id: 2,
        style: {
            "--leaf-left": "16%",
            "--leaf-size": "11px",
            "--leaf-duration": "13.6s",
            "--leaf-delay": "-2.1s",
            "--leaf-rotation": "1.18",
            "--leaf-drift": "14px",
        },
    },
    {
        id: 3,
        style: {
            "--leaf-left": "28%",
            "--leaf-size": "8px",
            "--leaf-duration": "10.4s",
            "--leaf-delay": "-4s",
            "--leaf-rotation": "0.92",
            "--leaf-drift": "-30px",
        },
    },
    {
        id: 4,
        style: {
            "--leaf-left": "42%",
            "--leaf-size": "12px",
            "--leaf-duration": "14.8s",
            "--leaf-delay": "-1.3s",
            "--leaf-rotation": "1.22",
            "--leaf-drift": "26px",
        },
    },
    {
        id: 5,
        style: {
            "--leaf-left": "55%",
            "--leaf-size": "7px",
            "--leaf-duration": "9.6s",
            "--leaf-delay": "-5.5s",
            "--leaf-rotation": "0.88",
            "--leaf-drift": "-12px",
        },
    },
    {
        id: 6,
        style: {
            "--leaf-left": "68%",
            "--leaf-size": "10px",
            "--leaf-duration": "12.5s",
            "--leaf-delay": "-3.2s",
            "--leaf-rotation": "1.1",
            "--leaf-drift": "18px",
        },
    },
    {
        id: 7,
        style: {
            "--leaf-left": "78%",
            "--leaf-size": "9px",
            "--leaf-duration": "11s",
            "--leaf-delay": "-6.4s",
            "--leaf-rotation": "1",
            "--leaf-drift": "-24px",
        },
    },
    {
        id: 8,
        style: {
            "--leaf-left": "88%",
            "--leaf-size": "11px",
            "--leaf-duration": "15.2s",
            "--leaf-delay": "-2.8s",
            "--leaf-rotation": "1.15",
            "--leaf-drift": "20px",
        },
    },
    {
        id: 9,
        style: {
            "--leaf-left": "12%",
            "--leaf-size": "8px",
            "--leaf-duration": "10.8s",
            "--leaf-delay": "-7.2s",
            "--leaf-rotation": "0.95",
            "--leaf-drift": "8px",
        },
    },
    {
        id: 10,
        style: {
            "--leaf-left": "36%",
            "--leaf-size": "10px",
            "--leaf-duration": "12.9s",
            "--leaf-delay": "-0.6s",
            "--leaf-rotation": "1.08",
            "--leaf-drift": "-16px",
        },
    },
    {
        id: 11,
        style: {
            "--leaf-left": "62%",
            "--leaf-size": "9px",
            "--leaf-duration": "11.6s",
            "--leaf-delay": "-4.4s",
            "--leaf-rotation": "1.02",
            "--leaf-drift": "12px",
        },
    },
    {
        id: 12,
        style: {
            "--leaf-left": "74%",
            "--leaf-size": "7px",
            "--leaf-duration": "9.2s",
            "--leaf-delay": "-8.1s",
            "--leaf-rotation": "0.9",
            "--leaf-drift": "-8px",
        },
    },
    {
        id: 13,
        style: {
            "--leaf-left": "48%",
            "--leaf-size": "11px",
            "--leaf-duration": "13.2s",
            "--leaf-delay": "-1.9s",
            "--leaf-rotation": "1.2",
            "--leaf-drift": "28px",
        },
    },
    {
        id: 14,
        style: {
            "--leaf-left": "92%",
            "--leaf-size": "8px",
            "--leaf-duration": "10.1s",
            "--leaf-delay": "-3.7s",
            "--leaf-rotation": "0.98",
            "--leaf-drift": "-20px",
        },
    },
];

function flattenMenuItems(items) {
    if (!Array.isArray(items)) return [];
    const out = [];
    for (const item of items) {
        out.push(item);
        out.push(...flattenMenuItems(item.children ?? item.items ?? []));
    }
    return out;
}

function normalizeMenuLinks(items, locale) {
    return flattenMenuItems(items)
        .map((item) => ({
            id: item.id ?? item.slug ?? item.name ?? item.url,
            name: item.name ?? item.title ?? "",
            url: ensureLocaleInUrl(
                item.url?.startsWith("http") || item.url?.startsWith("/")
                    ? item.url
                    : `/${locale}/${item.slug ?? item.url ?? ""}`,
                locale,
            ),
            key: item.slug ?? item.key ?? item.id ?? "",
        }))
        .filter((item) => item.name && item.url);
}

function useFooterData() {
    const { props } = usePage();
    const locale = props?.locale ?? "de";
    const menu = Array.isArray(props?.global?.menu) ? props.global.menu : [];
    const settings = props?.global?.settings ?? {};
    const branding = settings.branding ?? {};
    const contact = settings.contact ?? {};
    const social = settings.social ?? {};
    const footerSettings = settings.footer ?? {};

    return useMemo(() => {
        const infos = contact.contact_infos ?? [];
        const primary = infos.find((c) => c.is_primary) ?? infos[0];

        const address =
            contact.address ??
            (primary
                ? [primary.address, primary.city, primary.country]
                      .filter(Boolean)
                      .join("\n")
                : null) ??
            null;

        const email = contact.email ?? primary?.email ?? primary?.mail ?? null;
        const phone =
            contact.phone ??
            contact.mobile ??
            primary?.phone ??
            primary?.mobile ??
            null;
        const website = contact.website ?? primary?.website ?? null;
        const mapUrl = contact.map ?? primary?.map ?? null;

        const socialList = [
            social.facebook_url && {
                key: "facebook",
                href: social.facebook_url,
                label: "Facebook",
            },
            social.instagram_url && {
                key: "instagram",
                href: social.instagram_url,
                label: "Instagram",
            },
            social.twitter_url && {
                key: "twitter",
                href: social.twitter_url,
                label: "Twitter",
            },
            social.linkedin_url && {
                key: "linkedin",
                href: social.linkedin_url,
                label: "LinkedIn",
            },
            social.youtube_url && {
                key: "youtube",
                href: social.youtube_url,
                label: "YouTube",
            },
        ].filter(Boolean);

        const footerMenu =
            menu.find((m) =>
                ["footer", "Footer"].includes(m.location ?? m.type ?? m.slug),
            ) ??
            menu[1] ??
            null;

        const rawItems = footerMenu?.items ?? footerMenu?.children ?? [];
        const navItems = normalizeMenuLinks(rawItems, locale);

        const bottomMenu =
            menu.find((m) => Number(m?.id) === 3) ??
            menu.find((m) =>
                ["bottom", "legal"].includes(m.location ?? m.type ?? m.slug),
            ) ??
            null;
        const bottomItems = normalizeMenuLinks(
            bottomMenu?.items ?? bottomMenu?.children ?? [],
            locale,
        );

        const legalLinksRaw =
            footerSettings.legal_links ?? footerSettings.legalLinks ?? [];
        const legalLinks = Array.isArray(legalLinksRaw)
            ? legalLinksRaw
                  .map((l) => ({
                      name: l.name ?? l.title ?? "",
                      url: ensureLocaleInUrl(
                          l.url ?? `/${locale}/${l.slug ?? ""}`,
                          locale,
                      ),
                      key: l.key ?? l.slug ?? l.url ?? l.name ?? "",
                  }))
                  .filter((l) => l.name && l.url)
            : [];

        const logo =
            branding.logo ??
            branding.logo_dark ??
            branding.logo_light ??
            branding.dark_logo ??
            branding.light_logo ??
            null;

        const siteName =
            branding.site_name ??
            branding.siteName ??
            footerSettings.footer_copyright ??
            null;

        const description = footerSettings.footer_text ?? null;
        const ctaTitle =
            footerSettings.cta_title ?? footerSettings.ctaTitle ?? null;
        const ctaLabel =
            footerSettings.cta_label ?? footerSettings.ctaLabel ?? null;
        const ctaHref =
            footerSettings.cta_href ?? footerSettings.ctaHref ?? null;
        const navTitle = footerMenu?.name ?? null;
        const showNewsletter = footerSettings.show_newsletter ?? false;

        return {
            locale,
            logo,
            siteName,
            description,
            address,
            email,
            phone,
            website,
            mapUrl,
            contactInfos: infos,
            social: socialList,
            navItems,
            legalLinks: bottomItems.length > 0 ? bottomItems : legalLinks,
            ctaTitle,
            ctaLabel,
            ctaHref,
            navTitle,
            showNewsletter,
        };
    }, [locale, props?.global?.menu, props?.global?.settings]);
}

function SocialLink({ item }) {
    let Icon = null;
    if (item.key === "facebook") Icon = Facebook;
    else if (item.key === "instagram") Icon = Instagram;
    else if (item.key === "twitter") Icon = Twitter;
    else if (item.key === "linkedin") Icon = Linkedin;
    else if (item.key === "youtube") Icon = Youtube;
    if (!Icon) return null;

    return (
        <a
            href={item.href}
            aria-label={item.label}
            className="wh-foot-social"
            target="_blank"
            rel="noopener noreferrer"
        >
            <Icon size={15} strokeWidth={1.8} />
        </a>
    );
}

function ContactBlock({ address, email, phone, website, mapUrl }) {
    const { t } = useTranslation();
    const lines = (address || "").split("\n").filter(Boolean);
    const hasLinks = phone || email || website || mapUrl;
    if (!lines.length && !hasLinks) return null;

    return (
        <div className="wh-foot-contact">
            {lines.length > 0 && (
                <address className="wh-foot-address not-italic">
                    {lines.map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            {i < lines.length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </address>
            )}
            {hasLinks && (
                <ul className="wh-foot-links">
                    {phone && (
                        <li key="phone">
                            <a
                                href={`tel:${phone.replace(/\s/g, "")}`}
                                className="wh-foot-link"
                            >
                                {phone}
                            </a>
                        </li>
                    )}
                    {email && (
                        <li key="email">
                            <a
                                href={`mailto:${email}`}
                                className="wh-foot-link"
                            >
                                {email}
                            </a>
                        </li>
                    )}
                    {website && (
                        <li key="website">
                            <a
                                href={website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="wh-foot-link"
                            >
                                {website
                                    .replace(/^https?:\/\//, "")
                                    .replace(/\/$/, "")}
                            </a>
                        </li>
                    )}
                    {mapUrl && (
                        <li key="map">
                            <a
                                href={mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="wh-foot-link"
                            >
                                {t("footer.viewOnMap")}
                            </a>
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}

export default function Footer() {
    const { t } = useTranslation();
    const d = useFooterData();
    const year = new Date().getFullYear();

    const ctaTitleText = d.ctaTitle ?? t("footer.ctaTitle");
    const ctaLabelText = d.ctaLabel ?? t("footer.planYourStay");
    const ctaHrefResolved = d.ctaHref ?? ensureLocaleInUrl("/hotels", d.locale);

    const hasBrand = d.logo || d.description || d.social.length > 0;
    const hasNav = d.navItems.length > 0;
    const hasContact = d.address || d.email || d.phone || d.website || d.mapUrl;

    return (
        <footer className="wh-foot" role="contentinfo">
            <div className="wh-foot-ambient" aria-hidden="true" />
            <div className="wh-nature-layer" aria-hidden="true">
                {TREE_LAYERS.map((layer) => (
                    <img
                        key={layer.key}
                        src={TREE_IMG}
                        alt={layer.alt}
                        className={layer.className}
                        loading="lazy"
                        decoding="async"
                    />
                ))}
                <div className="wh-leaves">
                    {LEAVES.map((leaf) => (
                        <span
                            key={leaf.id}
                            className="wh-leaf"
                            style={leaf.style}
                            aria-hidden="true"
                        />
                    ))}
                </div>
            </div>
            <div className="wh-foot-cta">
                <div className="wh-container wh-foot-cta__inner">
                    <h2 id="footer-cta-title">{ctaTitleText}</h2>
                    <a
                        href="/#gift-voucher-promo"
                        className="wh-btn wh-btn--primary"
                    >
                        {ctaLabelText}
                    </a>
                </div>
            </div>

            {(hasBrand || hasNav || hasContact) && (
                <div className="wh-foot-main">
                    <div className="wh-container wh-foot-grid">
                        {hasBrand && (
                            <div className="wh-foot-col wh-foot-col--brand">
                                {d.logo && (
                                    <a href="/" className="wh-foot-brand">
                                        <img
                                            src={d.logo}
                                            alt={d.siteName || "Logo"}
                                            className="wh-foot-logo"
                                        />
                                    </a>
                                )}
                                {d.description && (
                                    <p className="wh-foot-text">
                                        {d.description}
                                    </p>
                                )}
                                {d.social.length > 0 && (
                                    <div className="wh-foot-socials">
                                        {d.social.map((s) => (
                                            <SocialLink key={s.key} item={s} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {hasNav && (
                            <nav className="wh-foot-col">
                                {d.navTitle && (
                                    <h4 className="wh-foot-title">
                                        {d.navTitle}
                                    </h4>
                                )}
                                <ul className="wh-foot-list">
                                    {d.navItems.map((item) => (
                                        <li key={item.id}>
                                            <a href={item.url}>{item.name}</a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        )}

                        {hasContact && (
                            <div className="wh-foot-col">
                                <h4 className="wh-foot-title">
                                    {t("footer.contact")}
                                </h4>
                                <ContactBlock
                                    address={d.address}
                                    email={d.email}
                                    phone={d.phone}
                                    website={d.website}
                                    mapUrl={d.mapUrl}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {(d.siteName || d.legalLinks.length > 0) && (
                <div className="wh-foot-bottom">
                    <div className="wh-container wh-foot-bottom__inner">
                        {d.siteName && (
                            <p className="wh-foot-copy">
                                &copy; {year}{" "}
                                <a
                                    href="http://omer-dogan.company/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="wh-foot-link"
                                >
                                    {d.siteName}
                                </a>
                                . {t("footer.rightsReserved")}
                            </p>
                        )}{" "}
                        {d.legalLinks.length > 0 && (
                            <ul className="wh-foot-mini">
                                {d.legalLinks.map((l) => (
                                    <li key={l.key}>
                                        <a href={l.url}>{l.name}</a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </footer>
    );
}

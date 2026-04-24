import React, { useMemo } from "react";
import { usePage } from "@inertiajs/react";
import { useTranslation } from "@/i18n";
import { ensureLocaleInUrl } from "@/utils/url";

import { Facebook, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";
import {
    deduplicateByUrl,
    ensureTreeNoDuplicates,
    flattenTreeForNav,
} from "@/utils/menuUtils";

import "../../css/Footer.css";

function resolveFooterText(value, locale) {
    if (typeof value === "string") return value.trim();
    if (!value || typeof value !== "object") return "";

    const localized =
        value[locale] ??
        value[locale?.toLowerCase?.()] ??
        value.de ??
        value.en ??
        value.tr ??
        value.title ??
        value.label ??
        value.name;

    return typeof localized === "string" ? localized.trim() : "";
}

function flattenMenuItems(items) {
    if (!Array.isArray(items)) return [];
    const out = [];
    for (const item of items) {
        out.push(item);
        out.push(...flattenMenuItems(item.children ?? item.items ?? []));
    }
    return out;
}

function extractMenuCollection(menuSource) {
    if (Array.isArray(menuSource)) return menuSource;
    if (Array.isArray(menuSource?.data)) return menuSource.data;
    if (Array.isArray(menuSource?.items)) return menuSource.items;
    return menuSource ? [menuSource] : [];
}

function resolveMenuLocation(menu, locale) {
    return [
        menu?.location,
        menu?.type,
        menu?.slug,
        menu?.key,
        resolveFooterText(menu?.name, locale),
        resolveFooterText(menu?.title, locale),
        resolveFooterText(menu?.label, locale),
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

function getMenuItems(menu) {
    const rawItems =
        menu?.items ??
        menu?.children ??
        menu?.menu_items ??
        menu?.menuItems ??
        menu?.links ??
        [];

    if (!Array.isArray(rawItems) || !rawItems.length) return [];
    return ensureTreeNoDuplicates(rawItems);
}

function normalizeMenuLinks(items, locale) {
    return deduplicateByUrl(flattenTreeForNav(getMenuItems(items)))
        .map((item) => ({
            id: item.id ?? item.slug ?? item.name ?? item.url,
            name:
                resolveFooterText(item.name, locale) ||
                resolveFooterText(item.title, locale) ||
                resolveFooterText(item.label, locale),
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

function normalizeFooterLinks(items, locale) {
    return flattenMenuItems(items)
        .map((item) => ({
            id: item.id ?? item.slug ?? item.name ?? item.url,
            name:
                resolveFooterText(item.name, locale) ||
                resolveFooterText(item.title, locale) ||
                resolveFooterText(item.label, locale),
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
    const menu = extractMenuCollection(props?.global?.menu);
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
            menu.find((m) => {
                const haystack = resolveMenuLocation(m, locale);
                return (
                    haystack.includes("footer") ||
                    haystack.includes("footer menu") ||
                    haystack.includes("fuss") ||
                    haystack.includes("bottom")
                );
            }) ??
            menu[1] ??
            null;

        const navItems = normalizeMenuLinks(footerMenu, locale);

        const bottomMenu =
            menu.find((m) => Number(m?.id) === 3) ??
            menu.find((m) =>
                ["bottom", "legal"].includes(m.location ?? m.type ?? m.slug),
            ) ??
            null;
        const bottomItems = normalizeFooterLinks(
            getMenuItems(bottomMenu),
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
        const navTitle =
            resolveFooterText(footerMenu?.name, locale) ||
            resolveFooterText(footerMenu?.title, locale) ||
            "Navigation";
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
    const quickLinks = d.navItems.slice(0, 8);
    const hasLegal = d.legalLinks.length > 0;

    return (
        <footer className="wh-foot" role="contentinfo">
            <div className="wh-foot-ambient" aria-hidden="true" />
            <div className="wh-foot-gridline" aria-hidden="true" />
            <div className="wh-foot-cta">
                <div className="wh-container wh-foot-cta__inner">
                    <h2 id="footer-cta-title">{ctaTitleText}</h2>
                    <a
                        href={ctaHrefResolved}
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
                                <div className="wh-foot-brand-wrap">
                                    {d.logo && (
                                        <a href="/" className="wh-foot-brand">
                                            <img
                                                src={d.logo}
                                                alt={d.siteName || "Logo"}
                                                className="wh-foot-logo"
                                            />
                                        </a>
                                    )}
                                    {d.siteName && (
                                        <span className="wh-foot-badge">
                                            {d.siteName}
                                        </span>
                                    )}
                                </div>
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
                            <nav className="wh-foot-col wh-foot-col--nav">
                                {d.navTitle && (
                                    <h4 className="wh-foot-title">
                                        {d.navTitle}
                                    </h4>
                                )}
                                <ul className="wh-foot-list wh-foot-list--grid">
                                    {quickLinks.map((item) => (
                                        <li key={item.id}>
                                            <a href={item.url}>{item.name}</a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        )}

                        {hasContact && (
                            <div className="wh-foot-col wh-foot-col--contact">
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

            {d.siteName && (
                <div className="wh-foot-bottom">
                    <div className="wh-container wh-foot-bottom__inner">
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
                    </div>
                </div>
            )}
        </footer>
    );
}

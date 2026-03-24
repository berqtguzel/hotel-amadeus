import React, { useMemo } from "react";
import { usePage } from "@inertiajs/react";
import { ensureLocaleInUrl } from "@/utils/url";

import { Facebook, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";

import "../../css/Footer.css";

function flattenMenuItems(items) {
    if (!Array.isArray(items)) return [];
    const out = [];
    for (const item of items) {
        out.push(item);
        out.push(...flattenMenuItems(item.children ?? item.items ?? []));
    }
    return out;
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
        const flatItems = flattenMenuItems(rawItems);

        const navItems = flatItems
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
            legalLinks,
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
            <Icon size={18} strokeWidth={1.8} />
        </a>
    );
}

function ContactBlock({ address, email, phone, website, mapUrl }) {
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
                <div className="wh-foot-links">
                    {phone && (
                        <a
                            href={`tel:${phone.replace(/\s/g, "")}`}
                            className="wh-foot-link"
                        >
                            {phone}
                        </a>
                    )}
                    {email && (
                        <a href={`mailto:${email}`} className="wh-foot-link">
                            {email}
                        </a>
                    )}
                    {website && (
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
                    )}
                    {mapUrl && (
                        <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wh-foot-link"
                        >
                            Karte anzeigen
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Footer() {
    const d = useFooterData();
    const year = new Date().getFullYear();

    const hasCta = d.ctaTitle && d.ctaLabel && d.ctaHref;
    const hasBrand = d.logo || d.description || d.social.length > 0;
    const hasNav = d.navItems.length > 0;
    const hasContact = d.address || d.email || d.phone || d.website || d.mapUrl;

    return (
        <footer className="wh-foot" role="contentinfo">
            {hasCta && (
                <div className="wh-foot-cta">
                    <div className="wh-container wh-foot-cta__inner">
                        <h3>{d.ctaTitle}</h3>
                        <a
                            href={`/track?${new URLSearchParams({
                                redirect: ensureLocaleInUrl(
                                    d.ctaHref,
                                    d.locale,
                                ),
                                button_id: "footer-cta",
                                button_label: d.ctaLabel || "",
                            }).toString()}`}
                            className="wh-btn wh-btn--invert"
                        >
                            {d.ctaLabel}
                        </a>
                    </div>
                </div>
            )}

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
                                <h4 className="wh-foot-title">Kontakt</h4>
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
                                &copy; {year} {d.siteName}
                            </p>
                        )}
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

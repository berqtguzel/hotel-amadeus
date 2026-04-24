import React from "react";
import { usePage } from "@inertiajs/react";
import {
    FiArrowUpRight,
    FiFacebook,
    FiGlobe,
    FiInstagram,
    FiMail,
    FiMapPin,
    FiPhoneCall,
    FiTwitter,
} from "react-icons/fi";
import "../../../css/experience-hero.css";
import CountUp from "../ReactBits/Texts/CountUp";

function stripHtml(value = "") {
    return String(value)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getPrimaryContact(contact) {
    if (!contact) return null;

    const infos = Array.isArray(contact.contact_infos)
        ? contact.contact_infos
        : [];

    return infos.find((item) => item?.is_primary) ?? infos[0] ?? null;
}

function getLocaleCopy(locale, brandName) {
    const content = {
        tr: {
            eyebrow: brandName,
            badgeLabel: "Deneyim",
            badgeCaption: "Konaklama ve misafir deneyiminde rafine yaklasim",
            badgeUnit: "Yil",
            statStay: "Misafir odakli",
            statStayValue: "Premium servis",
            statReach: "Dogrudan iletisim",
            statReachValue: "Hizli geri donus",
            contactLabel: "Iletisim",
            socialLabel: "Sosyal medya",
            mapLabel: "Konum",
            phoneLabel: "Telefon",
            emailLabel: "E-posta",
            ctaLabel: "Bizi kesfedin",
        },
        en: {
            eyebrow: brandName,
            badgeLabel: "Experience",
            badgeCaption: "A refined approach to hospitality and guest comfort",
            badgeUnit: "Years",
            statStay: "Guest focused",
            statStayValue: "Premium service",
            statReach: "Direct contact",
            statReachValue: "Fast response",
            contactLabel: "Contact",
            socialLabel: "Social media",
            mapLabel: "Location",
            phoneLabel: "Phone",
            emailLabel: "Email",
            ctaLabel: "Discover more",
        },
        de: {
            eyebrow: brandName,
            badgeLabel: "Erfahrung",
            badgeCaption:
                "Gastfreundschaft mit stilvoller Atmosphaere und echter Sorgfalt",
            badgeUnit: "Jahre",
            statStay: "Gastorientiert",
            statStayValue: "Premium Service",
            statReach: "Direkter Kontakt",
            statReachValue: "Schnelle Rueckmeldung",
            contactLabel: "Kontakt",
            socialLabel: "Soziale Medien",
            mapLabel: "Standort",
            phoneLabel: "Telefon",
            emailLabel: "E-Mail",
            ctaLabel: "Mehr entdecken",
        },
    };

    return content[locale] ?? content.de;
}

const ExperienceHero = () => {
    const { props } = usePage();

    const data = props?.global?.widgets?.serviceHighlights || {};
    const settings = props?.global?.settings || {};
    const settingsContact = settings?.contact || {};
    const settingsSocial = settings?.social || {};
    const branding = settings?.branding || {};
    const locale = props?.global?.locale || props?.locale || "de";

    const item = Array.isArray(data) ? data[0] : data;
    const translation =
        item?.translations?.find((t) => t.language_code === locale) ||
        item?.translations?.[0] ||
        {};

    const primaryContact = getPrimaryContact(settingsContact);
    const title =
        translation.name ||
        item?.name ||
        branding?.site_name ||
        "Hotel Amadeus";
    const description =
        translation.description ||
        item?.description ||
        "Experience a hospitality concept shaped by calm comfort, thoughtful service, and memorable stays.";
    const image = item?.image || branding?.hero_image || "";
    const years = Number(item?.years || 25);
    const brandName =
        branding?.site_name || branding?.brand_name || "Hotel Amadeus";
    const email =
        settingsContact?.email ||
        settingsContact?.reservation_email ||
        primaryContact?.email ||
        "";
    const phone =
        settingsContact?.phone ||
        primaryContact?.phone ||
        primaryContact?.mobile ||
        "";
    const website =
        settingsContact?.website ||
        primaryContact?.website ||
        branding?.website ||
        "";
    const address = [
        primaryContact?.address,
        [primaryContact?.zip_code, primaryContact?.city]
            .filter(Boolean)
            .join(" "),
        [primaryContact?.country].filter(Boolean).join(", "),
    ]
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
        .join(", ");

    const copy = getLocaleCopy(locale, brandName);
    const summary = stripHtml(description);

    const socialLinks = [
        { key: "facebook", url: settingsSocial?.facebook_url },
        { key: "instagram", url: settingsSocial?.instagram_url },
        { key: "twitter", url: settingsSocial?.twitter_url },
    ].filter((link) => link.url);

    const statItems = [
        {
            label: copy.badgeLabel,
            value: years,
            suffix: copy.badgeUnit,
        },
        {
            label: copy.statStay,
            value: copy.statStayValue,
        },
        {
            label: copy.statReach,
            value: copy.statReachValue,
        },
    ];

    const contactCards = [
        phone
            ? {
                  icon: FiPhoneCall,
                  label: copy.phoneLabel,
                  value: phone,
                  href: `tel:${phone.replace(/\s+/g, "")}`,
              }
            : null,
        email
            ? {
                  icon: FiMail,
                  label: copy.emailLabel,
                  value: email,
                  href: `mailto:${email}`,
              }
            : null,
        address
            ? {
                  icon: FiMapPin,
                  label: copy.mapLabel,
                  value: address,
                  href: null,
              }
            : null,
    ].filter(Boolean);

    return (
        <section className="ex-wrap">
            <div className="ex-pattern" />

            <div className="ex-container">
                <div className="ex-content">
                    <span className="ex-eyebrow">{copy.eyebrow}</span>

                    <h1 className="ex-title">{title}</h1>

                    <p className="ex-lead">{summary}</p>

                    <div className="ex-actions">
                        {website ? (
                            <a
                                href={website}
                                target="_blank"
                                rel="noreferrer"
                                className="ex-cta ex-cta--primary"
                            >
                                <span>{copy.ctaLabel}</span>
                                <FiArrowUpRight aria-hidden />
                            </a>
                        ) : null}

                        {email ? (
                            <a
                                href={`mailto:${email}`}
                                className="ex-cta ex-cta--ghost"
                            >
                                <FiMail className="ex-icon" />
                                <span>{copy.contactLabel}</span>
                            </a>
                        ) : null}
                    </div>

                    {contactCards.length ? (
                        <div className="ex-contact-grid">
                            {contactCards.map((card) => {
                                const Icon = card.icon;
                                const Wrapper = card.href ? "a" : "div";

                                return (
                                    <Wrapper
                                        key={`${card.label}-${card.value}`}
                                        className="ex-contact-card"
                                        href={card.href || undefined}
                                    >
                                        <span className="ex-contact-card__icon">
                                            <Icon aria-hidden />
                                        </span>
                                        <span className="ex-contact-card__copy">
                                            <span className="ex-contact-card__label">
                                                {card.label}
                                            </span>
                                            <strong>{card.value}</strong>
                                        </span>
                                    </Wrapper>
                                );
                            })}
                        </div>
                    ) : null}

                    {socialLinks.length ? (
                        <div className="ex-social-block">
                            <span className="ex-meta-label">
                                {copy.socialLabel}
                            </span>
                            <div className="ex-social">
                                {socialLinks.map((entry) => {
                                    const Icon =
                                        entry.key === "facebook"
                                            ? FiFacebook
                                            : entry.key === "instagram"
                                              ? FiInstagram
                                              : FiTwitter;

                                    return (
                                        <a
                                            key={entry.key}
                                            className="ex-social-btn"
                                            href={entry.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={entry.key}
                                        >
                                            <Icon />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}
                </div>

                <figure className="ex-media">
                    {image ? (
                        <img src={image} alt={title} loading="lazy" />
                    ) : (
                        <div className="ex-media__placeholder">
                            <FiGlobe aria-hidden />
                            <span>{brandName}</span>
                        </div>
                    )}

                    <div className="ex-media__overlay" />

                    <figcaption className="ex-badge">
                        <span className="ex-badge-label">
                            {copy.badgeLabel}
                        </span>
                        <div className="ex-badge-main">
                            <span className="ex-badge-num">
                                <CountUp
                                    className="ex-count-up"
                                    from={0}
                                    to={years}
                                    duration={1.4}
                                />
                            </span>
                            <span className="ex-badge-unit">
                                {copy.badgeUnit}
                            </span>
                        </div>
                        <span className="ex-badge-divider" aria-hidden="true" />
                        <span className="ex-badge-caption">
                            {copy.badgeCaption}
                        </span>
                    </figcaption>
                </figure>
            </div>
        </section>
    );
};

export default ExperienceHero;

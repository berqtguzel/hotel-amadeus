import React from "react";
import { usePage } from "@inertiajs/react";
import { FiArrowUpRight, FiMail, FiMapPin, FiPhoneCall } from "react-icons/fi";

function getPrimaryContact(contact) {
    if (!contact) return null;

    const infos = Array.isArray(contact.contact_infos)
        ? contact.contact_infos
        : [];

    return infos.find((item) => item?.is_primary) ?? infos[0] ?? null;
}

function buildAddressLines(info) {
    if (!info) return [];

    const lines = [
        info.address,
        [info.zip_code, info.city].filter(Boolean).join(" "),
        [info.district, info.country].filter(Boolean).join(", "),
    ]
        .map((item) => String(item || "").trim())
        .filter(Boolean);

    return Array.from(new Set(lines));
}

export default function MapSectionClient({
    titleResolved,
    subtitleResolved,
    mapHref,
    mapEmbedUrl,
    openMapLabel,
    eyebrowLabel,
}) {
    const { props } = usePage();
    const locale = props?.global?.locale ?? "de";
    const contactSettings = props?.global?.settings?.contact ?? null;
    const primaryContact = getPrimaryContact(contactSettings);
    const addressLines = buildAddressLines(primaryContact);
    const phone = primaryContact?.phone ?? contactSettings?.phone ?? "";
    const email = primaryContact?.email ?? contactSettings?.email ?? "";
    const labels = {
        de: { address: "Adresse", phone: "Telefon", email: "E-Mail" },
        en: { address: "Address", phone: "Phone", email: "Email" },
        tr: { address: "Adres", phone: "Telefon", email: "E-Posta" },
    }[locale] ?? {
        address: "Address",
        phone: "Phone",
        email: "Email",
    };

    const detailItems = [
        addressLines.length
            ? {
                  icon: FiMapPin,
                  label: labels.address,
                  value: addressLines.join(", "),
                  href: mapHref,
              }
            : null,
        phone
            ? {
                  icon: FiPhoneCall,
                  label: labels.phone,
                  value: phone,
                  href: `tel:${phone.replace(/\s+/g, "")}`,
              }
            : null,
        email
            ? {
                  icon: FiMail,
                  label: labels.email,
                  value: email,
                  href: `mailto:${email}`,
              }
            : null,
    ].filter(Boolean);

    return (
        <section className="mp-section" aria-label={openMapLabel}>
            <div className="mp-container">
                <div className="mp-shell">
                    <div className="mp-content">
                        <div className="mp-header">
                            {eyebrowLabel && (
                                <span className="mp-eyebrow">
                                    {eyebrowLabel}
                                </span>
                            )}

                            <h1 className="mp-title">{titleResolved}</h1>
                            <p className="mp-subtitle">{subtitleResolved}</p>
                        </div>

                        {detailItems.length ? (
                            <div className="mp-info-grid">
                                {detailItems.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <a
                                            key={`${item.label}-${item.value}`}
                                            className="mp-info-card"
                                            href={item.href}
                                            target={
                                                item.href === mapHref
                                                    ? "_blank"
                                                    : undefined
                                            }
                                            rel={
                                                item.href === mapHref
                                                    ? "noopener noreferrer"
                                                    : undefined
                                            }
                                        >
                                            <span className="mp-info-card__icon">
                                                <Icon aria-hidden />
                                            </span>

                                            <span className="mp-info-card__copy">
                                                <span className="mp-info-card__label">
                                                    {item.label}
                                                </span>
                                                <strong>{item.value}</strong>
                                            </span>
                                        </a>
                                    );
                                })}
                            </div>
                        ) : null}

                        <div className="mp-actions">
                            <a
                                className="mp-map-link"
                                href={mapHref}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <span>{openMapLabel}</span>
                                <FiArrowUpRight aria-hidden />
                            </a>
                        </div>
                    </div>

                    <div className="mp-map-panel">
                        <div className="mp-map-wrap">
                            <iframe
                                title="Google Maps"
                                src={mapEmbedUrl}
                                className="mp-google-iframe"
                                width="100%"
                                height="450"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />

                            <div className="mp-map-badge">
                                <span className="mp-map-badge__dot" />
                                <span>Google Maps</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

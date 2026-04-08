import React from "react";

export default function MapSectionClient({
    titleResolved,
    subtitleResolved,
    mapHref,
    mapEmbedUrl,
    openMapLabel,
    eyebrowLabel,
}) {
    return (
        <section className="mp-section" aria-label={openMapLabel}>
            <div className="mp-container">
                <div className="mp-header">
                    {eyebrowLabel && (
                        <span className="eyebrow">{eyebrowLabel}</span>
                    )}
                    <h1 className="mp-title">{titleResolved}</h1>
                    <p className="mp-subtitle">{subtitleResolved}</p>
                    <a
                        className="mp-map-link"
                        href={mapHref}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {openMapLabel}
                    </a>
                </div>

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
                </div>
            </div>
        </section>
    );
}

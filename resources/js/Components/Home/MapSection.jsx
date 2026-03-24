import React, { useEffect, useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import { useTranslation } from "@/i18n";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../../css/map-section.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const WERRAPARK_POSITION = [50.5167, 10.7833];
const GERMANY_CENTER = [51.1657, 10.4515];
const DEFAULT_ZOOM = 6;

const DEFAULTS = {
    title: "Werrapark Resort – Mitten in Deutschland",
    subtitle:
        "Entdecken Sie uns im Herzen des Thüringer Waldes, umgeben von unberührter Natur.",
    markerTitle: "Werrapark Resort",
    markerAddress: "R.-Breitscheid-Straße 41–45, 98574 Masserberg",
};

function getContactFromSettings(contact) {
    if (!contact) return null;
    const infos = contact.contact_infos ?? [];
    if (!infos.length) return null;
    const primary = infos.find((c) => c?.is_primary) ?? infos[0];
    return primary;
}

function buildMapHref(mapUrl, markerPosition, markerAddress) {
    if (typeof mapUrl === "string" && mapUrl.trim() !== "") {
        return mapUrl.trim();
    }

    const [lat, lng] = Array.isArray(markerPosition) ? markerPosition : [];
    if (typeof lat === "number" && typeof lng === "number") {
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }

    const query = encodeURIComponent(markerAddress || DEFAULTS.markerAddress);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export default function MapSection({
    title = DEFAULTS.title,
    subtitle = DEFAULTS.subtitle,
    markerTitle = DEFAULTS.markerTitle,
    markerAddress: markerAddressProp,
}) {
    const { t } = useTranslation();
    const { props } = usePage();
    const [isClient, setIsClient] = useState(false);

    const contactData = useMemo(() => {
        const contact = props?.global?.settings?.contact;
        const info = getContactFromSettings(contact);
        if (!info) return null;

        const lat = parseFloat(info.latitude);
        const lng = parseFloat(info.longitude);
        const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng);

        const addr = [info.address, info.city, info.district, info.country]
            .filter(Boolean)
            .join(", ");

        return {
            markerPosition: hasCoords ? [lat, lng] : WERRAPARK_POSITION,
            markerTitle: info.title ?? markerTitle,
            markerAddress:
                addr || (markerAddressProp ?? DEFAULTS.markerAddress),
            mapUrl: info.map,
        };
    }, [props?.global?.settings?.contact, markerTitle, markerAddressProp]);

    const markerPosition = contactData?.markerPosition ?? WERRAPARK_POSITION;
    const markerTitleResolved =
        contactData?.markerTitle ?? markerTitle ?? DEFAULTS.markerTitle;
    const markerAddressResolved =
        contactData?.markerAddress ??
        markerAddressProp ??
        DEFAULTS.markerAddress;
    const mapHref = buildMapHref(
        contactData?.mapUrl,
        markerPosition,
        markerAddressResolved,
    );

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <section className="mp-section" aria-label={t("map.openMap")}>
                <div className="mp-placeholder">
                    <div className="mp-placeholder-inner">
                        <span className="mp-placeholder-icon">🗺️</span>
                        <p>{t("map.loading")}</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="mp-section" aria-label={t("map.openMap")}>
            <div className="mp-header">
                <span className="eyebrow">Standort</span>
                <h2 className="mp-title">{title}</h2>
                <p className="mp-subtitle">{subtitle}</p>
                <a
                    className="mp-map-link"
                    href={mapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {t("map.openMap")}
                </a>
            </div>

            <div className="mp-map-wrap">
                <MapContainer
                    center={markerPosition}
                    zoom={DEFAULT_ZOOM}
                    className="mp-map"
                    scrollWheelZoom={true}
                    zoomControl={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />
                    <Marker position={markerPosition}>
                        <Popup>
                            <strong>{markerTitleResolved}</strong>
                            <br />
                            {markerAddressResolved}
                            {mapHref && (
                                <>
                                    <br />
                                    <a
                                        href={mapHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            marginTop: "8px",
                                            display: "inline-block",
                                            fontSize: "13px",
                                        }}
                                    >
                                        {t("map.openMap")} →
                                    </a>
                                </>
                            )}
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>
        </section>
    );
}

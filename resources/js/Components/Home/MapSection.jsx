import React, { useEffect, useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import { useTranslation } from "@/i18n";
import "../../../css/map-section.css";

const WERRAPARK_POSITION = [50.5167, 10.7833];
const DEFAULT_ZOOM = 15;

const DEFAULTS = {
    markerAddress: "R.-Breitscheid-Straße 41–45, 98574 Masserberg",
};

function getContactFromSettings(contact) {
    if (!contact) return null;
    const infos = contact.contact_infos ?? [];
    const primary = infos.find((c) => c?.is_primary) ?? infos[0];
    return primary;
}

// Google Maps ana sayfasına yönlendiren link
function buildMapHref(markerPosition, markerAddress) {
    const [lat, lng] = Array.isArray(markerPosition) ? markerPosition : [];
    const query =
        lat && lng
            ? `${lat},${lng}`
            : encodeURIComponent(markerAddress || DEFAULTS.markerAddress);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

// iframe için Google Embed URL
function buildGoogleEmbedUrl(
    markerPosition,
    markerAddress,
    zoom = DEFAULT_ZOOM,
) {
    const [lat, lng] = Array.isArray(markerPosition) ? markerPosition : [];
    const query =
        lat && lng
            ? `${lat},${lng}`
            : encodeURIComponent(markerAddress || DEFAULTS.markerAddress);
    // q= parametresi marker'ın görünmesini sağlar
    return `https://www.google.com/maps?q=${query}&z=${zoom}&output=embed&hl=de`;
}

export default function MapSection({
    title,
    subtitle,
    markerTitle,
    markerAddress: markerAddressProp,
}) {
    const { t } = useTranslation();
    const { props } = usePage();
    const [isClient, setIsClient] = useState(false);
    const [MapSectionClient, setMapSectionClient] = useState(null);

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
        };
    }, [props?.global?.settings?.contact, markerTitle, markerAddressProp]);

    const markerPosition = contactData?.markerPosition ?? WERRAPARK_POSITION;
    const markerAddressResolved =
        contactData?.markerAddress ??
        markerAddressProp ??
        DEFAULTS.markerAddress;

    const mapHref = buildMapHref(markerPosition, markerAddressResolved);
    const mapEmbedUrl = buildGoogleEmbedUrl(
        markerPosition,
        markerAddressResolved,
    );

    useEffect(() => {
        setIsClient(true);
        import("./MapSectionClient").then((m) =>
            setMapSectionClient(() => m.default),
        );
    }, []);

    if (!isClient || !MapSectionClient) {
        return (
            <section className="mp-section loading">
                <div className="mp-placeholder">{t("map.loading")}</div>
            </section>
        );
    }

    return (
        <MapSectionClient
            titleResolved={title ?? t("map.title")}
            subtitleResolved={subtitle ?? t("map.subtitle")}
            mapHref={mapHref}
            mapEmbedUrl={mapEmbedUrl}
            openMapLabel={t("map.openMap")}
            eyebrowLabel={t("map.eyebrow")}
        />
    );
}

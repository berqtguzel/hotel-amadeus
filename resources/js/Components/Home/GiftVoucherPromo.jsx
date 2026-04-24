import React from "react";
import { Link, usePage } from "@inertiajs/react";
import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "@/i18n";
import "../../../css/gift-voucher-promo.css";

export default function GiftVoucherPromo() {
    const { props } = usePage();
    const locale = props?.locale ?? "de";
    const branding = props?.global?.settings?.branding ?? {};
    const { t } = useTranslation();
    const href = `/${locale}/gutschein`;
    const cardLogo =
        branding.logo_light ??
        branding.light_logo ??
        branding.logo ??
        branding.logo_dark ??
        branding.dark_logo ??
        "/images/Logo/logo.png";
    const brandName =
        branding.site_name ?? branding.siteName ?? "Hotel Amadeus";
    const benefitItems = [
        t("giftVoucherPromo.benefit1"),
        t("giftVoucherPromo.benefit2"),
        t("giftVoucherPromo.benefit3"),
    ];

    return (
        <section
            id="gift-voucher-promo"
            className="gvp-wrap"
            aria-label={t("giftVoucherPromo.ariaLabel")}
        >
            <div className="gvp-shell">
                <div className="gvp-copy">
                    <span className="gvp-badge">
                        {t("giftVoucherPromo.badge")}
                    </span>

                    <h1 className="gvp-title">{t("giftVoucherPromo.title")}</h1>

                    <p className="gvp-desc">
                        {t("giftVoucherPromo.description")}
                    </p>

                    <div className="gvp-actions">
                        <Link className="gvp-btn gvp-btn--primary" href={href}>
                            <span>{t("giftVoucherPromo.primaryCta")}</span>
                            <span className="gvp-btn__icon">
                                <ArrowUpRight size={18} />
                            </span>
                        </Link>
                    </div>

                    <ul
                        className="gvp-list"
                        aria-label={t("giftVoucherPromo.benefitsAria")}
                    >
                        {benefitItems.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </div>

                <div className="gvp-visual" aria-hidden="true">
                    <div className="gvp-card gvp-card--front">
                        <div className="gvp-card__head">
                            <img
                                className="gvp-card__logo"
                                src={cardLogo}
                                alt={brandName}
                            />
                            <span className="gvp-card__tag">Gift</span>
                        </div>

                        <div className="gvp-card__body">
                            <strong>{t("giftVoucherPromo.cardTitle")}</strong>
                            <span className="gvp-card__meta">
                                Spa . Stay . Dining
                            </span>
                        </div>

                        <div className="gvp-card__foot">
                            <em>{t("giftVoucherPromo.cardAmount")}</em>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

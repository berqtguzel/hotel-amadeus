import React from "react";
import { Link, usePage } from "@inertiajs/react";
import { useTranslation } from "@/i18n";
import "../../../css/gift-voucher-promo.css";

export default function GiftVoucherPromo() {
    const { props } = usePage();
    const locale = props?.locale ?? "de";
    const { t } = useTranslation();
    const href = `/${locale}/gutschein`;

    return (
        <section
            className="gvp-wrap"
            aria-label={t("giftVoucherPromo.ariaLabel")}
        >
            <div className="gvp-shell">
                <div className="gvp-copy">
                    <span className="gvp-badge">
                        {t("giftVoucherPromo.badge")}
                    </span>
                    <h2 className="gvp-title">
                        {t("giftVoucherPromo.title")}
                    </h2>
                    <p className="gvp-desc">
                        {t("giftVoucherPromo.description")}
                    </p>

                    <div className="gvp-actions">
                        <Link className="gvp-btn gvp-btn--primary" href={href}>
                            {t("giftVoucherPromo.primaryCta")}
                        </Link>
                        <Link className="gvp-btn gvp-btn--ghost" href={href}>
                            {t("giftVoucherPromo.secondaryCta")}
                        </Link>
                    </div>

                    <ul
                        className="gvp-list"
                        aria-label={t("giftVoucherPromo.benefitsAria")}
                    >
                        <li>{t("giftVoucherPromo.benefit1")}</li>
                        <li>{t("giftVoucherPromo.benefit2")}</li>
                        <li>{t("giftVoucherPromo.benefit3")}</li>
                    </ul>
                </div>

                <div className="gvp-visual" aria-hidden="true">
                    <div className="gvp-card gvp-card--back" />
                    <div className="gvp-card gvp-card--front">
                        <span className="chip" />
                        <span className="brand">WR</span>
                        <strong>{t("giftVoucherPromo.cardTitle")}</strong>
                        <em>{t("giftVoucherPromo.cardAmount")}</em>
                    </div>
                </div>
            </div>
        </section>
    );
}

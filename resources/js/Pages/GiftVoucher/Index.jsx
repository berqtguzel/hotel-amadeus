import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import SeoHead from "@/Components/SeoHead";
import { useTranslation } from "@/i18n";
import "@/../css/gift-voucher-page.css";

export default function GiftVoucherPage({
    currentRoute = "gutschein",
    locale = "de",
    companies = [],
    paymentMethods = {},
    billingApi = { ok: true, message: null },
}) {
    const { t } = useTranslation();

    const stripe = paymentMethods.stripe ?? {};
    const paypal = paymentMethods.paypal ?? {};
    const sepa = paymentMethods.sepa ?? {};

    // ❌ API ve tracking tamamen kaldırıldı

    const handleNavigation = (e, href) => {
        e.preventDefault();
        window.location.assign(href);
    };

    const methods = [
        {
            key: "stripe",
            title: "Stripe",
            desc: t("giftVoucher.methodStripeDesc"),
            href: `/${locale}/gutschein/stripe`,
            enabled: Boolean(stripe.enabled),
            accent: "stripe",
        },
        {
            key: "paypal",
            title: "PayPal",
            desc: t("giftVoucher.methodPaypalDesc"),
            href: `/${locale}/gutschein/paypal`,
            enabled: Boolean(paypal.enabled),
            accent: "paypal",
        },
        {
            key: "sepa",
            title: "SEPA",
            desc: t("giftVoucher.methodSepaDesc"),
            href: `/${locale}/gutschein/sepa`,
            enabled: Boolean(sepa.enabled),
            accent: "sepa",
        },
    ];

    return (
        <AppLayout currentRoute={currentRoute}>
            <SeoHead
                title={t("giftVoucher.pageTitle")}
                description={t("giftVoucher.heroSubtitle")}
            />

            <section className="gvf-page">
                <div className="gvf-box gvf-box--landing">
                    <header className="gvf-head gvf-head--landing">
                        <span className="gvf-kicker">
                            {t("giftVoucher.landingKicker")}
                        </span>
                        <h1>{t("giftVoucher.pageTitle")}</h1>
                        <p>{t("giftVoucher.heroSubtitle")}</p>
                    </header>

                    {billingApi && billingApi.ok === false ? (
                        <div className="gvf-api-banner" role="status">
                            <strong>Billing-API:</strong>{" "}
                            {billingApi.message
                                ? String(billingApi.message)
                                : t("giftVoucher.apiFallback")}
                        </div>
                    ) : null}

                    <section className="gvf-intro">
                        <div className="gvf-intro-card">
                            <span className="gvf-intro-label">
                                {t("giftVoucher.giftFor")}
                            </span>
                            <h1>{t("giftVoucher.introTitle")}</h1>
                            <p>{t("giftVoucher.introText")}</p>
                        </div>

                        <div className="gvf-intro-card gvf-intro-card--highlight">
                            <span className="gvf-intro-label">
                                {t("giftVoucher.brandLabel")}
                            </span>
                            <h1>Werrapark</h1>
                            <p>{t("giftVoucher.brandText")}</p>
                        </div>
                    </section>

                    <div className="gvf-method-header">
                        <div>
                            <h1>{t("giftVoucher.methodsTitle")}</h1>
                            <p>{t("giftVoucher.methodsSubtitle")}</p>
                        </div>
                    </div>

                    <div className="gvf-pay-grid">
                        {methods.map((m) => (
                            <div
                                key={m.key}
                                className={`gvf-pay-card gvf-pay-card--${m.accent} ${
                                    m.enabled ? "" : "is-disabled"
                                }`}
                            >
                                <span className="gvf-pay-badge">{m.title}</span>
                                <h2>{m.title}</h2>
                                <p>{m.desc}</p>

                                {m.enabled ? (
                                    <a
                                        href={m.href}
                                        className="gvf-pay-link"
                                        onClick={(e) =>
                                            handleNavigation(e, m.href)
                                        }
                                    >
                                        {t("giftVoucher.continueWith", {
                                            method: m.title,
                                        })}
                                    </a>
                                ) : (
                                    <span className="gvf-pay-locked">
                                        {t("giftVoucher.notActivated")}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <p className="gvf-invoice-hint">
                        {t("giftVoucher.invoiceHint")}
                    </p>
                </div>
            </section>
        </AppLayout>
    );
}

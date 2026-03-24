import React from "react";
import { Head, Link } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
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

    React.useEffect(() => {
        const methodsDebug = {
            stripe: {
                enabled: Boolean(stripe.enabled),
                has_public: stripe.has_public ?? false,
                publishable_key: stripe.publishable_key ?? null,
                connected_account_id: stripe.connected_account_id ?? null,
            },
            paypal: {
                enabled: Boolean(paypal.enabled),
                has_client_id: paypal.has_client_id ?? false,
                client_id: paypal.client_id ?? null,
                merchant_id: paypal.merchant_id ?? null,
            },
            sepa: {
                enabled: Boolean(sepa.enabled),
                creditor_name: sepa.creditor_name ?? null,
                iban_masked: sepa.iban_masked ?? null,
                bic: sepa.bic ?? null,
                bank_name: sepa.bank_name ?? null,
            },
        };

        console.log("Gift voucher debug", {
            billingApi,
            companies,
            paymentMethods: methodsDebug,
        });
    }, [billingApi, companies, paypal, sepa, stripe]);

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
            <Head title={t("giftVoucher.pageTitle")} />
            <section className="gvf-page">
                <div className="gvf-box gvf-box--landing">
                    <header className="gvf-head gvf-head--landing">
                        <span className="gvf-kicker">
                            {t("giftVoucher.landingKicker")}
                        </span>
                        <h1>{t("giftVoucher.pageTitle")}</h1>
                        <p>{t("giftVoucher.heroSubtitle")}</p>
                        <div className="gvf-pill-row">
                            <span className="gvf-pill">
                                {t("giftVoucher.pillInstant")}
                            </span>
                            <span className="gvf-pill">
                                {t("giftVoucher.pillFlexible")}
                            </span>
                            <span className="gvf-pill">
                                {t("giftVoucher.pillDigital")}
                            </span>
                        </div>
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
                            <h2>{t("giftVoucher.introTitle")}</h2>
                            <p>{t("giftVoucher.introText")}</p>
                        </div>
                        <div className="gvf-intro-card gvf-intro-card--highlight">
                            <span className="gvf-intro-label">
                                {t("giftVoucher.brandLabel")}
                            </span>
                            <h2>Werrapark</h2>
                            <p>{t("giftVoucher.brandText")}</p>
                        </div>
                    </section>

                    <div className="gvf-method-header">
                        <div>
                            <h2>{t("giftVoucher.methodsTitle")}</h2>
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
                                    <Link
                                        href={m.href}
                                        className="gvf-pay-link"
                                    >
                                        {t("giftVoucher.continueWith", {
                                            method: m.title,
                                        })}
                                    </Link>
                                ) : (
                                    <span className="gvf-pay-locked">
                                        {t("giftVoucher.notActivated")}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {companies.length > 0 ? (
                        <section className="gvf-side-section">
                            <h2>{t("giftVoucher.companySectionTitle")}</h2>
                            <ul className="gvf-company-list">
                                {companies.map((c) => (
                                    <li key={c.id ?? c.slug ?? c.name}>
                                        <strong>{c.name ?? "—"}</strong>
                                        {c.currency ? (
                                            <span> · {c.currency}</span>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    <p className="gvf-invoice-hint">
                        {t("giftVoucher.invoiceHint")}
                    </p>
                </div>
            </section>
        </AppLayout>
    );
}

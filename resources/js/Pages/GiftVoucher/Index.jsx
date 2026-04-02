import React from "react";
import { Link } from "@inertiajs/react";
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

    // 🔥 SESSION ID
    const getSessionId = () => {
        let sessionId = localStorage.getItem("tracking_session_id");

        if (!sessionId) {
            sessionId = crypto.randomUUID();
            localStorage.setItem("tracking_session_id", sessionId);
        }

        return sessionId;
    };
    const sendTracking = (payload) => {
        const formData = new FormData();

        formData.append("button_key", payload.button || "unknown");

        formData.append("session_id", getSessionId());

        formData.append(
            "metadata",
            JSON.stringify({
                page: window.location.href,
                ...(payload.metadata || {}),
            }),
        );

        fetch("https://omerdogan.de/api/v1/button-tracking/track", {
            method: "POST",
            headers: {
                "X-Tenant-ID": "test_werraparkde_69b90f95bde60",
            },
            body: formData,
        })
            .then((res) => res.json())
            .then(console.log);
    };

    // 🔥 PAGE TRACKING
    React.useEffect(() => {
        sendTracking({
            button: "page_view_gutschein",
            metadata: {
                locale,
            },
        });
    }, [locale, sendTracking]);

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

                    {/* 🔥 PAYMENT METHODS */}
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
                                        onClick={() => {
                                            sendTracking({
                                                button: `select_payment_${m.key}`,
                                                metadata: {
                                                    method: m.key,
                                                    locale,
                                                },
                                            });
                                        }}
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

                    <p className="gvf-invoice-hint">
                        {t("giftVoucher.invoiceHint")}
                    </p>
                </div>
            </section>
        </AppLayout>
    );
}

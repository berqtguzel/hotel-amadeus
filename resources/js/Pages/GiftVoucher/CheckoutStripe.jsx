import React from "react";
import { Head } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import GiftVoucherForm from "@/Components/GiftVoucher/GiftVoucherForm";
import { useTranslation } from "@/i18n";
import "@/../css/gift-voucher-page.css";

function maskPublishableKey(key) {
    if (!key || typeof key !== "string") return "—";
    const t = key.trim();
    if (t.length <= 14) return t;
    return `${t.slice(0, 12)}…${t.slice(-4)}`;
}

function maskStripeAccount(id) {
    if (!id || typeof id !== "string") return null;
    const t = id.trim();
    if (t.length <= 12) return t;
    return `${t.slice(0, 7)}…${t.slice(-4)}`;
}

export default function CheckoutStripe({
    currentRoute = "gutschein",
    locale = "de",
    paymentMethods = {},
}) {
    const { t } = useTranslation();
    const stripe = paymentMethods.stripe ?? {};
    const ready = Boolean(stripe.enabled);

    const paymentPanel = (
        <div className="gvf-method-panel">
            <h3>{t("giftVoucher.stripePanelTitle")}</h3>
            {ready ? (
                <div className="gvf-method-stack">
                    {stripe.publishable_key ? (
                        <p className="gvf-hint">
                            {t("giftVoucher.stripePublishableKey")}:{" "}
                            <code>
                                {maskPublishableKey(stripe.publishable_key)}
                            </code>
                        </p>
                    ) : null}
                    {stripe.has_public && !stripe.publishable_key ? (
                        <p className="gvf-hint">
                            {t("giftVoucher.stripePublicAvailable")}
                        </p>
                    ) : null}
                    {stripe.connected_account_id ? (
                        <p className="gvf-hint">
                            {t("giftVoucher.stripeConnectAccount")}:{" "}
                            <code>
                                {maskStripeAccount(stripe.connected_account_id)}
                            </code>
                        </p>
                    ) : null}
                </div>
            ) : (
                <p className="gvf-warn">
                    {t("giftVoucher.stripeUnavailableNote")}
                </p>
            )}
            <p className="gvf-note">
                {t("giftVoucher.stripeIntegrationNote")}
            </p>
        </div>
    );

    const footerAction = (
        <button
            type="button"
            className="gvf-pay-btn"
            disabled={!ready}
            title={ready ? "" : t("giftVoucher.stripeUnavailableTitle")}
        >
            {ready
                ? t("giftVoucher.payWithStripe")
                : t("giftVoucher.stripeUnavailableTitle")}
        </button>
    );

    return (
        <AppLayout currentRoute={currentRoute}>
            <Head title={`${t("giftVoucher.pageTitle")} - Stripe`} />
            <GiftVoucherForm
                locale={locale}
                methodTitle="Stripe"
                paymentPanel={paymentPanel}
                footerAction={footerAction}
            />
        </AppLayout>
    );
}

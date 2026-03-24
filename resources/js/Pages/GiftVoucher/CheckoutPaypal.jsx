import React from "react";
import { Head } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import GiftVoucherForm from "@/Components/GiftVoucher/GiftVoucherForm";
import { useTranslation } from "@/i18n";
import "@/../css/gift-voucher-page.css";

function maskClientId(id) {
    if (!id || typeof id !== "string") return "—";
    const t = id.trim();
    if (t.length <= 12) return t;
    return `${t.slice(0, 8)}…${t.slice(-4)}`;
}

function maskMerchantId(id) {
    if (!id || typeof id !== "string") return "—";
    const t = id.trim();
    if (t.length <= 14) return t;
    return `${t.slice(0, 10)}…${t.slice(-4)}`;
}

export default function CheckoutPaypal({
    currentRoute = "gutschein",
    locale = "de",
    paymentMethods = {},
}) {
    const { t } = useTranslation();
    const paypal = paymentMethods.paypal ?? {};
    const ready = Boolean(paypal.enabled);

    const paymentPanel = (
        <div className="gvf-method-panel">
            <h3>{t("giftVoucher.paypalPanelTitle")}</h3>
            {ready ? (
                <>
                    {paypal.client_id ? (
                        <p className="gvf-hint">
                            {t("giftVoucher.paypalClientId")}:{" "}
                            <code>{maskClientId(paypal.client_id)}</code>
                        </p>
                    ) : null}
                    {paypal.merchant_id ? (
                        <p className="gvf-hint">
                            {t("giftVoucher.paypalMerchantId")}:{" "}
                            <code>{maskMerchantId(paypal.merchant_id)}</code>
                        </p>
                    ) : null}
                    {paypal.has_client_id && !paypal.client_id ? (
                        <p className="gvf-hint">
                            {t("giftVoucher.paypalClientAvailable")}
                        </p>
                    ) : null}
                    <p className="gvf-note">
                        {t("giftVoucher.paypalMode")}:{" "}
                        <strong>{paypal.mode || "live"}</strong>
                    </p>
                </>
            ) : (
                <p className="gvf-warn">
                    {t("giftVoucher.paypalUnavailableNote")}
                </p>
            )}
            <p className="gvf-note">
                {t("giftVoucher.paypalIntegrationNote")}
            </p>
        </div>
    );

    const footerAction = (
        <button
            type="button"
            className="gvf-pay-btn gvf-pay-btn--paypal"
            disabled={!ready}
            title={ready ? "" : t("giftVoucher.paypalUnavailableTitle")}
        >
            {ready
                ? t("giftVoucher.payWithPaypal")
                : t("giftVoucher.paypalUnavailableTitle")}
        </button>
    );

    return (
        <AppLayout currentRoute={currentRoute}>
            <Head title={`${t("giftVoucher.pageTitle")} - PayPal`} />
            <GiftVoucherForm
                locale={locale}
                methodTitle="PayPal"
                paymentPanel={paymentPanel}
                footerAction={footerAction}
            />
        </AppLayout>
    );
}

import React from "react";
import { Link } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import SeoHead from "@/Components/SeoHead";
import { useTranslation } from "@/i18n";
import "@/../css/gift-voucher-page.css";

function getNumberLocale(locale) {
    if (locale === "tr") return "tr-TR";
    if (locale === "en") return "en-GB";
    return "de-DE";
}

export default function GiftVoucherInvoicePage({
    currentRoute = "gutschein",
    locale = "de",
    invoice = null,
    invoiceRef = null,
}) {
    const { t } = useTranslation();

    const money = new Intl.NumberFormat(getNumberLocale(locale), {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    });

    const homeHref = `/${locale}`;

    const invoiceNumber =
        invoice?.invoice_number || invoice?.number || invoiceRef || "—";

    const status = invoice?.payment?.status || invoice?.status || "pending";

    const paymentMethod =
        invoice?.payment?.method || invoice?.payment_method || "—";

    const totalValue =
        invoice?.pricing?.total_amount ??
        invoice?.total_amount ??
        invoice?.total ??
        0;

    const customerName =
        invoice?.customer?.name || invoice?.customer_name || "—";

    const customerEmail =
        invoice?.customer?.email || invoice?.customer_email || "—";

    const description = invoice?.description || null;

    return (
        <AppLayout currentRoute={currentRoute}>
            <SeoHead
                title={t("giftVoucher.invoicePageTitle")}
                description={t("giftVoucher.invoicePageSubtitle")}
            />

            <section className="gvf-page">
                <div className="gvf-box gvf-box--checkout">
                    <header className="gvf-head gvf-head--checkout">
                        <span className="gvf-kicker">
                            {t("giftVoucher.checkoutKicker")}
                        </span>
                        <h1>{t("giftVoucher.invoicePageTitle")}</h1>
                        <p>{t("giftVoucher.invoicePageSubtitle")}</p>
                    </header>

                    {invoice ? (
                        <section className="gvf-section">
                            <div className="gvf-submit-state gvf-submit-state--success">
                                <strong>
                                    {t("giftVoucher.invoiceCreatedSuccess")}
                                </strong>

                                <div className="gvf-invoice-result-grid">
                                    <div>
                                        <span>
                                            {t("giftVoucher.resultInvoice")}
                                        </span>
                                        <b>{invoiceNumber}</b>
                                    </div>

                                    <div>
                                        <span>
                                            {t("giftVoucher.resultStatus")}
                                        </span>
                                        <b>{status}</b>
                                    </div>

                                    <div>
                                        <span>
                                            {t("giftVoucher.resultMethod")}
                                        </span>
                                        <b>{paymentMethod}</b>
                                    </div>

                                    <div>
                                        <span>
                                            {t("giftVoucher.resultTotal")}
                                        </span>
                                        <b>{money.format(totalValue)}</b>
                                    </div>

                                    <div>
                                        <span>
                                            {t("giftVoucher.resultCustomer")}
                                        </span>
                                        <b>{customerName}</b>
                                    </div>

                                    <div>
                                        <span>
                                            {t("giftVoucher.resultEmail")}
                                        </span>
                                        <b>{customerEmail}</b>
                                    </div>
                                </div>

                                {description ? (
                                    <div className="gvf-method-panel">
                                        <h3>
                                            {t(
                                                "giftVoucher.invoiceDescription",
                                            )}
                                        </h3>
                                        <p>{description}</p>
                                    </div>
                                ) : null}
                            </div>
                        </section>
                    ) : (
                        <section className="gvf-section">
                            <div className="gvf-submit-state gvf-submit-state--error">
                                <strong>
                                    {t("giftVoucher.invoiceNotFoundTitle")}
                                </strong>
                                <p>{t("giftVoucher.invoiceNotFoundText")}</p>
                            </div>
                        </section>
                    )}

                    <div className="gvf-footer">
                        <Link href={homeHref} className="gvf-pay-btn">
                            {t("giftVoucher.backToHome")}
                        </Link>
                    </div>
                </div>
            </section>
        </AppLayout>
    );
}

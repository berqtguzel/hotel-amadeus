import React from "react";
import { Link, usePage } from "@inertiajs/react";
import { useTranslation } from "@/i18n";
import { useEffect } from "react";

function getNumberLocale(locale) {
    if (locale === "tr") return "tr-TR";
    if (locale === "en") return "en-GB";
    return "de-DE";
}

export default function GiftVoucherForm({
    locale = "de",
    backHref,
    methodTitle,
    paymentPanel,
    paymentMethod,
    paymentReady = false,
    submitLabel,
    submitVariant = "",
    companies = [],
    defaultCompanyId = null,
}) {
    const { coupons, url } = usePage().props;
    const { t } = useTranslation();

    const presetAmounts = [100, 200, 300, 400, 500];
    const [selectedAmount, setSelectedAmount] = React.useState(100);
    const [useCustom, setUseCustom] = React.useState(false);
    const [customAmount, setCustomAmount] = React.useState("");
    const [quantity, setQuantity] = React.useState(1);
    const [recipientName, setRecipientName] = React.useState("");
    const [recipientEmail, setRecipientEmail] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [companyId, setCompanyId] = React.useState(
        defaultCompanyId ?? companies[0]?.id ?? "",
    );
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState("");

    const parsedCustom = Number(customAmount);
    const customValue = Number.isFinite(parsedCustom)
        ? Math.min(500, Math.max(10, parsedCustom))
        : 0;

    const amount = useCustom ? customValue || 10 : selectedAmount;
    const total = amount * Math.max(1, quantity);
    const back = backHref ?? `/${locale}/gutschein`;

    const money = new Intl.NumberFormat(getNumberLocale(locale), {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    });

    const buildInvoiceHref = React.useCallback(
        (payload) => {
            const invoice = payload?.invoice ?? null;
            const created = payload?.data ?? null;

            const invoiceRef =
                invoice?.id ??
                created?.id ??
                invoice?.invoice_number ??
                created?.invoice_number ??
                null;

            if (!invoiceRef) {
                return null;
            }

            return `/${locale}/gutschein/rechnung/${encodeURIComponent(String(invoiceRef))}`;
        },
        [locale],
    );

    React.useEffect(() => {
        if (!companyId && companies[0]?.id) {
            setCompanyId(defaultCompanyId ?? companies[0].id);
        }
    }, [companies, companyId, defaultCompanyId]);

    const resolveErrorMessage = React.useCallback(
        (payload) => {
            if (!payload || typeof payload !== "object") {
                return t("giftVoucher.submitError");
            }

            const fieldErrors = payload.errors;

            if (fieldErrors && typeof fieldErrors === "object") {
                const firstEntry = Object.values(fieldErrors).find(
                    (entry) => Array.isArray(entry) && entry[0],
                );

                if (Array.isArray(firstEntry) && firstEntry[0]) {
                    return String(firstEntry[0]);
                }
            }

            if (payload.message) {
                return String(payload.message);
            }

            return t("giftVoucher.submitError");
        },
        [t],
    );

    const sendTracking = React.useCallback(
        async (payload) => {
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute("content") ?? "";

            const sessionId = localStorage.getItem("werrapark_analytics_sid");

            const requestBody = {
                event: payload.event ?? "button_click",
                session_id: sessionId,
                button_id: payload.button_id ?? payload.button ?? "unknown",
                button_label: payload.button_label ?? null,
                button_name: payload.button_name ?? null,
                page: window.location.href,
                url: window.location.pathname, // API URL'i değil temiz path gönderiyoruz
                metadata: payload.metadata ?? {},
            };

            try {
                const response = await fetch("/track-button", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    body: JSON.stringify(requestBody),
                });

                // Geri kalan hata kontrolleri aynı kalabilir...
                const responseText = await response.text();
                let responseData = null;
                try {
                    responseData = responseText
                        ? JSON.parse(responseText)
                        : null;
                } catch {
                    responseData = responseText;
                }
                return responseData;
            } catch (err) {
                console.error("❌ TRACKING ERROR:", err);
                return null;
            }
        },
        [url], // url bağımlılığı zaten var
    );

    useEffect(() => {
        sendTracking({
            event: "page_view",
            button_id: `page_view_gutschein_${paymentMethod || "unknown"}`,
            button_label: methodTitle || paymentMethod || "unknown",
            button_name: "gift_voucher_page_view",
            metadata: {
                url,
                locale,
                payment_method: paymentMethod,
            },
        });
    }, [url, locale, paymentMethod, methodTitle, sendTracking]);

    const handleSubmit = async () => {
        if (!paymentReady || submitting) {
            return;
        }

        const cleanName = recipientName.trim();
        const cleanEmail = recipientEmail.trim();
        const numericCompanyId = Number(companyId);

        await sendTracking({
            event: "submit_click",
            button_id: "gift-voucher-submit",
            button_label: submitLabel || t("giftVoucher.payNow"),
            button_name: "gift_voucher_submit",
            metadata: {
                amount,
                quantity,
                payment_method: paymentMethod,
                company_id: numericCompanyId || null,
            },
        });

        if (!cleanName) {
            setSubmitError(t("giftVoucher.validationName"));
            return;
        }

        if (!cleanEmail) {
            setSubmitError(t("giftVoucher.validationEmail"));
            return;
        }

        if (!Number.isFinite(numericCompanyId) || numericCompanyId <= 0) {
            setSubmitError(t("giftVoucher.validationCompany"));
            return;
        }

        setSubmitting(true);
        setSubmitError("");

        try {
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute("content") ?? "";

            const response = await fetch("/api/billing/invoices", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({
                    company_id: numericCompanyId,
                    customer_name: cleanName,
                    customer_email: cleanEmail,
                    total_amount: total,
                    amount,
                    quantity,
                    payment_method: paymentMethod,
                    message: message.trim(),
                    description: `Werrapark gift voucher - ${quantity} x ${amount} EUR - ${paymentMethod}`,
                }),
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(resolveErrorMessage(payload));
            }

            const invoiceHref = buildInvoiceHref(payload);

            if (!invoiceHref) {
                throw new Error(t("giftVoucher.invoiceRedirectError"));
            }

            window.location.assign(invoiceHref);
            return;
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : t("giftVoucher.submitError"),
            );
        } finally {
            setSubmitting(false);
        }
    };

    const actionClassName = `gvf-pay-btn ${submitVariant}`.trim();

    return (
        <section className="gvf-page">
            <div className="gvf-box gvf-box--checkout">
                <div className="gvf-checkout-top">
                    <Link href={back} className="gvf-back">
                        ← {t("giftVoucher.backToMethods")}
                    </Link>

                    <header className="gvf-head gvf-head--checkout">
                        <span className="gvf-kicker">
                            {t("giftVoucher.checkoutKicker")}
                        </span>
                        <h1>{t("giftVoucher.pageTitle")}</h1>
                        <p>
                            {methodTitle
                                ? t("giftVoucher.paymentWith", {
                                      method: methodTitle,
                                  })
                                : t("giftVoucher.checkoutSubtitle")}
                        </p>
                    </header>
                </div>

                <div className="gvf-top">
                    <div className="gvf-amounts">
                        <div className="gvf-section-head">
                            <h2>{t("giftVoucher.chooseAmount")}</h2>
                            <p>{t("giftVoucher.chooseAmountHint")}</p>
                        </div>

                        <div className="gvf-amount-grid">
                            {presetAmounts.map((value) => {
                                const active =
                                    !useCustom && selectedAmount === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        className={`gvf-amount-card ${active ? "is-active" : ""}`}
                                        onClick={() => {
                                            setUseCustom(false);
                                            setSelectedAmount(value);

                                            sendTracking({
                                                event: "button_click",
                                                button_id: `gift-voucher-amount-${value}`,
                                                button_label: `${value} EUR`,
                                                button_name:
                                                    "gift_voucher_amount_select",
                                                metadata: {
                                                    locale,
                                                    amount: value,
                                                    payment_method:
                                                        paymentMethod,
                                                },
                                            });
                                        }}
                                    >
                                        <span className="gvf-radio" />
                                        <strong>{money.format(value)}</strong>
                                        <small>
                                            {t("giftVoucher.oneTime")}
                                        </small>
                                    </button>
                                );
                            })}
                        </div>

                        <div
                            className={`gvf-custom ${useCustom ? "is-active" : ""}`}
                            onClick={() => {
                                setUseCustom(true);

                                sendTracking({
                                    event: "button_click",
                                    button_id: "gift-voucher-custom-amount",
                                    button_label: "Custom Amount",
                                    button_name: "gift_voucher_custom_amount",
                                    metadata: {
                                        locale,
                                        payment_method: paymentMethod,
                                    },
                                });
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    setUseCustom(true);

                                    sendTracking({
                                        event: "button_click",
                                        button_id: "gift-voucher-custom-amount",
                                        button_label: "Custom Amount",
                                        button_name:
                                            "gift_voucher_custom_amount",
                                        metadata: {
                                            locale,
                                            payment_method: paymentMethod,
                                        },
                                    });
                                }
                            }}
                        >
                            <span className="gvf-radio" />
                            <div className="gvf-custom-body">
                                <h3>{t("giftVoucher.customAmount")}</h3>
                                <div className="gvf-custom-input">
                                    <span>EUR</span>
                                    <input
                                        type="number"
                                        min={100}
                                        max={500}
                                        placeholder={t(
                                            "giftVoucher.customPlaceholder",
                                        )}
                                        value={customAmount}
                                        onChange={(e) => {
                                            setUseCustom(true);
                                            setCustomAmount(e.target.value);
                                        }}
                                    />
                                </div>
                                <p>{t("giftVoucher.customRange")}</p>
                            </div>
                        </div>
                    </div>

                    <aside className="gvf-preview" aria-hidden="true">
                        <div className="gvf-card gcf-back" />
                        <div className="gvf-card gcf-front">
                            <span className="gcf-chip" />
                            <span className="gcf-brand">WERRAPARK</span>
                            <span className="gcf-tag">
                                {t("giftVoucher.cardTag")}
                            </span>

                            <em>{money.format(amount)}</em>
                        </div>
                    </aside>
                </div>

                <section className="gvf-section">
                    <div className="gvf-section-head">
                        <h2>{t("giftVoucher.recipientInfo")}</h2>
                        <p>{t("giftVoucher.recipientHint")}</p>
                    </div>

                    <div className="gvf-form-row">
                        <label>
                            {t("giftVoucher.recipientName")}
                            <input
                                type="text"
                                placeholder={t(
                                    "giftVoucher.recipientNamePlaceholder",
                                )}
                                value={recipientName}
                                onChange={(e) =>
                                    setRecipientName(e.target.value)
                                }
                            />
                        </label>

                        <label>
                            {t("giftVoucher.recipientEmail")}
                            <input
                                type="email"
                                placeholder={t(
                                    "giftVoucher.recipientEmailPlaceholder",
                                )}
                                value={recipientEmail}
                                onChange={(e) =>
                                    setRecipientEmail(e.target.value)
                                }
                            />
                        </label>
                    </div>

                    <label className="gvf-full">
                        {t("giftVoucher.messageLabel")}
                        <textarea
                            rows={5}
                            placeholder={t("giftVoucher.messagePlaceholder")}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </label>
                </section>

                <section className="gvf-section">
                    <div className="gvf-section-head">
                        <h2>{t("giftVoucher.summaryTitle")}</h2>
                        <p>{t("giftVoucher.summaryHint")}</p>
                    </div>

                    <div className="gvf-summary-grid">
                        {companies.length > 1 ? (
                            <label>
                                {t("giftVoucher.companyLabel")}
                                <select
                                    value={companyId}
                                    onChange={(e) =>
                                        setCompanyId(e.target.value)
                                    }
                                >
                                    {companies.map((company) => (
                                        <option
                                            key={company.id ?? company.name}
                                            value={company.id ?? ""}
                                        >
                                            {company.name ?? "—"}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : null}

                        <label>
                            {t("giftVoucher.quantity")}
                            <input
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={(e) =>
                                    setQuantity(Number(e.target.value) || 1)
                                }
                            />
                        </label>

                        <label>
                            {t("giftVoucher.selectedAmount")}
                            <input
                                type="text"
                                value={money.format(amount)}
                                readOnly
                            />
                        </label>

                        <label>
                            {t("giftVoucher.total")}
                            <input
                                type="text"
                                value={money.format(total)}
                                readOnly
                            />
                        </label>
                    </div>

                    {paymentPanel ? (
                        <div className="gvf-payment-slot">{paymentPanel}</div>
                    ) : null}

                    <div className="gvf-footer">
                        <div className="gvf-total">
                            <span>{t("giftVoucher.total")}</span>
                            <strong>{money.format(total)}</strong>
                        </div>

                        <button
                            type="button"
                            className={actionClassName}
                            disabled={!paymentReady || submitting}
                            title={
                                !paymentReady
                                    ? t("giftVoucher.paymentUnavailable")
                                    : ""
                            }
                            onClick={handleSubmit}
                        >
                            {submitting
                                ? t("giftVoucher.processing")
                                : submitLabel || t("giftVoucher.payNow")}
                        </button>
                    </div>

                    {submitError ? (
                        <div className="gvf-submit-state gvf-submit-state--error">
                            <strong>{t("giftVoucher.submitErrorTitle")}</strong>
                            <p>{submitError}</p>
                        </div>
                    ) : null}
                </section>

                {Array.isArray(coupons) && coupons.length > 0 ? (
                    <section className="gvf-section">
                        <div className="gvf-section-head">
                            <h2>{t("giftVoucher.availableCoupons")}</h2>
                        </div>

                        <div className="gvf-summary-grid">
                            {coupons.map((coupon, index) => (
                                <div key={coupon?.id ?? index}>
                                    <strong>
                                        {coupon?.title ??
                                            coupon?.name ??
                                            `Coupon ${index + 1}`}
                                    </strong>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : null}
            </div>
        </section>
    );
}

import React from "react";
import { Link } from "@inertiajs/react";
import { useTranslation } from "@/i18n";

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
    footerAction,
}) {
    const { t } = useTranslation();
    const presetAmounts = [100, 200, 300, 400, 500];
    const [selectedAmount, setSelectedAmount] = React.useState(100);
    const [useCustom, setUseCustom] = React.useState(false);
    const [customAmount, setCustomAmount] = React.useState("");
    const [quantity, setQuantity] = React.useState(1);
    const [recipientName, setRecipientName] = React.useState("");
    const [recipientEmail, setRecipientEmail] = React.useState("");
    const [message, setMessage] = React.useState("");

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
                            onClick={() => setUseCustom(true)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) =>
                                (e.key === "Enter" || e.key === " ") &&
                                setUseCustom(true)
                            }
                        >
                            <span className="gvf-radio" />
                            <div className="gvf-custom-body">
                                <h3>{t("giftVoucher.customAmount")}</h3>
                                <div className="gvf-custom-input">
                                    <span>EUR</span>
                                    <input
                                        type="number"
                                        min={10}
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
                        {footerAction ?? (
                            <button type="button" className="gvf-pay-btn">
                                {t("giftVoucher.payNow")}
                            </button>
                        )}
                    </div>
                </section>
            </div>
        </section>
    );
}

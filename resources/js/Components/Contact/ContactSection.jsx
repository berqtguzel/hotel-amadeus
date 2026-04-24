import React, { Fragment, useEffect, useRef, useState } from "react";
import { usePage, router } from "@inertiajs/react";
import { Dialog, Transition } from "@headlessui/react";
import "../../../css/contact.css";
import {
    Mail,
    Phone,
    MapPin,
    CheckCircle,
    Globe,
    AlertCircle,
} from "lucide-react";
import { useTranslation } from "@/i18n";
const norm = (s = "") =>
    String(s)
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();

const resolveMapEmbedUrl = (url, address) => {
    const fallbackQuery = String(address || "")
        .replace(/\s+/g, " ")
        .trim();

    try {
        if (url) {
            const parsed = new URL(url);
            const q =
                parsed.searchParams.get("q") ||
                parsed.searchParams.get("query") ||
                parsed.searchParams.get("destination");

            if (q) {
                return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
            }
        }
    } catch {}

    if (!fallbackQuery) return "";

    return `https://www.google.com/maps?q=${encodeURIComponent(fallbackQuery)}&z=15&output=embed`;
};
const sanitizePhoneInput = (value = "") =>
    String(value).replace(/[^\d+\s\-()]/g, "");

const sanitizeEmailInput = (value = "") => String(value).replace(/\s+/g, "");

const getContactFieldLabel = (field, t) =>
    ({
        name: t("contact.name"),
        phone: t("contact.phone"),
        email: t("contact.email"),
        message: t("contact.message"),
    })[field] || field;

const localizeContactError = (input, t) => {
    if (!input) {
        return {
            title: t("contact.errorTitle"),
            message: t("contact.error"),
        };
    }

    if (typeof input === "object" && !Array.isArray(input)) {
        const [field, rawValue] = Object.entries(input).find(([, value]) =>
            Array.isArray(value) ? value.length > 0 : Boolean(value),
        ) || [null, null];

        const firstMessage = Array.isArray(rawValue) ? rawValue[0] : rawValue;

        if (field && typeof firstMessage === "string") {
            return localizeContactError({ field, message: firstMessage }, t);
        }
    }

    if (typeof input === "object" && input.message) {
        const rawMessage = String(input.message);
        const fieldLabel = input.field
            ? getContactFieldLabel(input.field, t)
            : null;
        const lower = rawMessage.toLowerCase();

        if (
            lower.includes("required") ||
            lower.includes("pflicht") ||
            lower.includes("zorunlu")
        ) {
            return {
                title: t("contact.errorTitle"),
                message: fieldLabel
                    ? t("contact.validationRequired", { field: fieldLabel })
                    : t("contact.error"),
            };
        }

        if (
            lower.includes("valid email") ||
            lower.includes("email address") ||
            lower.includes("gueltige e-mail") ||
            lower.includes("gültige e-mail") ||
            lower.includes("gecerli e-posta") ||
            lower.includes("geçerli e-posta")
        ) {
            return {
                title: t("contact.errorTitle"),
                message: t("contact.validationEmail"),
            };
        }

        return {
            title: t("contact.errorTitle"),
            message: rawMessage,
        };
    }

    if (typeof input === "string") {
        return localizeContactError({ message: input }, t);
    }

    return {
        title: t("contact.errorTitle"),
        message: t("contact.error"),
    };
};

function TeamCard({ photo, name, title, email, phone, website }) {
    const { t } = useTranslation();

    return (
        <article className="ct-card">
            <div className="ct-card__header">
                <img src={photo} alt={name} className="ct-card__avatar" />

                <div className="ct-card__titles">
                    <h3 className="ct-card__name">{name}</h3>
                    <p className="ct-card__role">{title}</p>
                </div>
            </div>

            <div className="ct-card__meta">
                {email && (
                    <a className="ct-meta-row" href={`mailto:${email}`}>
                        <Mail size={16} />
                        <span>{email}</span>
                    </a>
                )}

                {phone && (
                    <a
                        className="ct-meta-row"
                        href={`tel:${phone.replace(/\s+/g, "")}`}
                    >
                        <Phone size={16} />
                        <span>{phone}</span>
                    </a>
                )}

                {website && (
                    <a
                        className="ct-meta-row"
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Globe size={16} />
                        <span>{t("team.web")}</span>
                    </a>
                )}
            </div>
        </article>
    );
}

export default function ContactPage() {
    const { t } = useTranslation();
    const { props } = usePage();
    const formRef = useRef(null);
    const [submitStatus, setSubmitStatus] = useState(null);
    const [canSubmit, setCanSubmit] = useState(false);
    const contactForms = props?.global?.contactForms ?? {};
    const settingsContact = props?.global?.settings?.contact ?? {};
    const apiStaff = props?.global?.staff ?? [];
    const locale = props?.global?.locale ?? "de";

    useEffect(() => {
        if (props?.flash?.success) {
            setSubmitStatus({ type: "success", message: props.flash.success });
        }
        if (props?.errors && Object.keys(props.errors).length > 0) {
            const localized = localizeContactError(props.errors, t);
            setSubmitStatus({ type: "error", ...localized });
        }
    }, [props?.flash, props?.errors, t]);

    useEffect(() => {
        if (submitStatus?.type !== "success") return;
        const t = setTimeout(() => {
            window.location.reload();
        }, 2000);
        return () => clearTimeout(t);
    }, [submitStatus?.type]);

    const staffSource = Array.isArray(apiStaff) ? apiStaff : [];

    let leadIdx = staffSource.findIndex((p) =>
        norm(p.name || "").includes("sezai koc"),
    );
    if (leadIdx < 0) leadIdx = 0;

    const orderedStaff = [
        staffSource[leadIdx],
        ...staffSource.filter((_, i) => i !== leadIdx),
    ]
        .filter(Boolean)
        .map((p) => ({
            photo:
                p.photo ||
                p.image ||
                p.avatar ||
                "/images/avatar-placeholder.png",
            name: p.name,
            title: p.title,
            email: p.email,
            phone: p.phone || p.tel || p.mobile,
            website: p.website_link || p.website || p.url,
        }));

    const executives = orderedStaff.slice(0, 3);
    const reservations = orderedStaff.slice(3);

    const addressStr =
        contactForms.contactInfo?.address ||
        (typeof settingsContact.address === "string"
            ? settingsContact.address
            : null) ||
        (settingsContact.street || settingsContact.address_line
            ? [
                  settingsContact.street ?? settingsContact.address_line,
                  settingsContact.city,
                  settingsContact.country,
              ]
                  .filter(Boolean)
                  .join(", ")
            : null) ||
        "";

    const contactInfo = {
        address: addressStr,
        phone:
            contactForms.contactInfo?.phone ||
            settingsContact.phone ||
            settingsContact.tel ||
            settingsContact.mobile ||
            "",
        email:
            contactForms.contactInfo?.email ||
            settingsContact.email ||
            settingsContact.mail ||
            "",
        map: settingsContact.map || null,
    };
    const mapEmbedUrl = resolveMapEmbedUrl(
        contactInfo.map,
        contactInfo.address,
    );

    const formFields = contactForms.formFields?.length
        ? contactForms.formFields
        : [];
    const formId = contactForms.forms?.[0]?.id ?? null;
    const hasForm = Boolean(formId) && formFields.length > 0;

    const updateFormValidity = () => {
        const form = formRef.current;
        setCanSubmit(Boolean(form && form.checkValidity()));
    };

    useEffect(() => {
        if (!hasForm) {
            setCanSubmit(false);
            return;
        }

        updateFormValidity();
    }, [hasForm, formFields]);

    const onSubmit = (e) => {
        e.preventDefault();
        const form = e.target;
        if (!form.checkValidity()) {
            updateFormValidity();
            return;
        }
        const formData = new FormData(form);
        const payload = {
            form_id: formId,
            name: formData.get("name") || "",
            email: formData.get("email") || "",
            phone: formData.get("phone") || "",
            message: formData.get("message") || "",
        };
        setSubmitStatus(null);
        router.post(route("contact.store", { locale }), payload, {
            onSuccess: () =>
                setSubmitStatus({
                    type: "success",
                    message: t("contact.success"),
                }),
            onError: (errors) => {
                const localized = localizeContactError(errors, t);
                setSubmitStatus({
                    type: "error",
                    ...localized,
                });
            },
        });
    };

    return (
        <main className="ct-section" id="kontakt">
            <div className="ct-container">
                <header className="ct-header">
                    <div className="ct-hero">
                        <div className="ct-hero__overlay" />
                        <div className="ct-hero__content">
                            <h1 className="ct-title">{t("contact.title")}</h1>
                        </div>
                    </div>
                </header>

                <section aria-labelledby="exec-title" className="ct-block">
                    <h1 id="exec-title" className="ct-block__title">
                        {t("contact.executives")}
                    </h1>
                    <div className="ct-grid">
                        {executives.map((p) => (
                            <TeamCard key={p.email || p.name} {...p} />
                        ))}
                    </div>
                </section>

                {reservations.length > 0 ? (
                    <section aria-labelledby="res-title" className="ct-block">
                        <h1 id="res-title" className="ct-block__title">
                            {t("contact.reservations")}
                        </h1>
                        <div className="ct-grid">
                            {reservations.map((p) => (
                                <TeamCard key={p.email || p.name} {...p} />
                            ))}
                        </div>
                    </section>
                ) : null}

                {/* Contact panel + form */}
                <section aria-labelledby="form-title" className="ct-panel">
                    <div className="ct-panel__info">
                        <h2 id="form-title" className="ct-panel__title">
                            {t("contact.formTitle")}
                        </h2>
                        <ul className="ct-info">
                            {contactInfo.address ? (
                                <li>
                                    <MapPin size={18} />
                                    <span>{contactInfo.address}</span>
                                </li>
                            ) : null}

                            {contactInfo.phone ? (
                                <li>
                                    <Phone size={18} />
                                    <a
                                        href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                                    >
                                        {contactInfo.phone}
                                    </a>
                                </li>
                            ) : null}

                            {contactInfo.email ? (
                                <li>
                                    <Mail size={18} />
                                    <a href={`mailto:${contactInfo.email}`}>
                                        {contactInfo.email}
                                    </a>
                                </li>
                            ) : null}
                        </ul>

                        {mapEmbedUrl ? (
                            <div
                                className="ct-map-placeholder"
                                aria-label={t("contact.mapLabel")}
                            >
                                <div className="ct-map-inner">
                                    <iframe
                                        src={mapEmbedUrl}
                                        title={t("contact.mapLabel")}
                                        className="ct-map-frame"
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                    {contactInfo.map ? (
                                        <a
                                            href={contactInfo.map}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ct-map-open"
                                        >
                                            {t("contact.mapBadge")}
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                        ) : (
                            <div
                                className="ct-map-placeholder"
                                aria-label={t("contact.mapLabel")}
                            >
                                <div className="ct-map-inner ct-map-inner--empty">
                                    <span className="ct-map-badge">
                                        {t("contact.mapBadge")}
                                    </span>
                                    <p className="ct-map-text">
                                        {t("contact.mapText")}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="ct-panel__form">
                        {submitStatus?.type === "error" && (
                            <div
                                className="ct-form-status ct-form-status--error"
                                role="alert"
                                aria-live="polite"
                            >
                                <div
                                    className="ct-form-status__icon"
                                    aria-hidden="true"
                                >
                                    <AlertCircle size={18} />
                                </div>
                                <div className="ct-form-status__body">
                                    <strong className="ct-form-status__title">
                                        {submitStatus.title ||
                                            t("contact.errorTitle")}
                                    </strong>
                                    <p className="ct-form-status__text">
                                        {submitStatus.message}
                                    </p>
                                </div>
                            </div>
                        )}
                        <Transition
                            appear
                            show={submitStatus?.type === "success"}
                            as={Fragment}
                        >
                            <Dialog
                                as="div"
                                className="ct-modal"
                                onClose={() => {
                                    setSubmitStatus(null);
                                    window.location.reload();
                                }}
                            >
                                <Transition.Child
                                    as={Fragment}
                                    enter="ct-modal__backdrop-enter"
                                    enterFrom="ct-modal__backdrop-enter-from"
                                    enterTo="ct-modal__backdrop-enter-to"
                                    leave="ct-modal__backdrop-leave"
                                    leaveFrom="ct-modal__backdrop-leave-from"
                                    leaveTo="ct-modal__backdrop-leave-to"
                                >
                                    <div
                                        className="ct-modal__backdrop"
                                        aria-hidden="true"
                                    />
                                </Transition.Child>

                                <div className="ct-modal__wrap">
                                    <div className="ct-modal__container">
                                        <Transition.Child
                                            as={Fragment}
                                            enter="ct-modal__panel-enter"
                                            enterFrom="ct-modal__panel-enter-from"
                                            enterTo="ct-modal__panel-enter-to"
                                            leave="ct-modal__panel-leave"
                                            leaveFrom="ct-modal__panel-leave-from"
                                            leaveTo="ct-modal__panel-leave-to"
                                        >
                                            <Dialog.Panel className="ct-modal__panel">
                                                <div className="ct-modal__icon">
                                                    <CheckCircle
                                                        size={56}
                                                        strokeWidth={1.5}
                                                    />
                                                </div>
                                                <Dialog.Title className="ct-modal__title">
                                                    {t("contact.successTitle")}
                                                </Dialog.Title>
                                                <Dialog.Description className="ct-modal__desc">
                                                    {submitStatus?.message}
                                                </Dialog.Description>
                                                <button
                                                    type="button"
                                                    className="ct-modal__btn"
                                                    onClick={() => {
                                                        setSubmitStatus(null);
                                                        window.location.reload();
                                                    }}
                                                >
                                                    {t("contact.successClose")}
                                                </button>
                                            </Dialog.Panel>
                                        </Transition.Child>
                                    </div>
                                </div>
                            </Dialog>
                        </Transition>
                        {hasForm ? (
                            <form
                                ref={formRef}
                                className="ct-form"
                                onSubmit={onSubmit}
                                onInput={updateFormValidity}
                                onChange={updateFormValidity}
                                noValidate
                            >
                                {formFields.map((field) => {
                                    const labelKey = `contact.${field.name}`;
                                    const labelText =
                                        t(labelKey) !== labelKey
                                            ? t(labelKey)
                                            : (field.label ?? field.name);
                                    const placeholderKey = `contact.${field.name}Placeholder`;
                                    const placeholderText =
                                        t(placeholderKey) !== placeholderKey
                                            ? t(placeholderKey)
                                            : (field.placeholder ?? "");
                                    const isPhoneField =
                                        field.name === "phone" ||
                                        field.type === "tel";
                                    const isEmailField =
                                        field.name === "email" ||
                                        field.type === "email";
                                    return (
                                        <div
                                            key={field.name}
                                            className={
                                                field.type === "textarea"
                                                    ? "ct-field ct-field--full"
                                                    : "ct-field"
                                            }
                                        >
                                            <label htmlFor={field.name}>
                                                {labelText}
                                                {field.required && " *"}
                                            </label>
                                            {field.type === "textarea" ? (
                                                <textarea
                                                    id={field.name}
                                                    name={field.name}
                                                    rows="6"
                                                    placeholder={
                                                        placeholderText ||
                                                        t(
                                                            "contact.messagePlaceholder",
                                                        )
                                                    }
                                                    required={field.required}
                                                />
                                            ) : (
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    type={field.type || "text"}
                                                    inputMode={
                                                        isPhoneField
                                                            ? "tel"
                                                            : isEmailField
                                                              ? "email"
                                                              : undefined
                                                    }
                                                    autoComplete={
                                                        isPhoneField
                                                            ? "tel"
                                                            : isEmailField
                                                              ? "email"
                                                              : undefined
                                                    }
                                                    pattern={
                                                        isPhoneField
                                                            ? "[0-9+()\\-\\s]*"
                                                            : undefined
                                                    }
                                                    spellCheck={
                                                        isEmailField
                                                            ? false
                                                            : undefined
                                                    }
                                                    placeholder={
                                                        placeholderText ||
                                                        (field.name === "phone"
                                                            ? "+49 …"
                                                            : "")
                                                    }
                                                    required={field.required}
                                                    onInput={(event) => {
                                                        if (isPhoneField) {
                                                            event.currentTarget.value =
                                                                sanitizePhoneInput(
                                                                    event
                                                                        .currentTarget
                                                                        .value,
                                                                );
                                                        }

                                                        if (isEmailField) {
                                                            event.currentTarget.value =
                                                                sanitizeEmailInput(
                                                                    event
                                                                        .currentTarget
                                                                        .value,
                                                                );
                                                        }

                                                        updateFormValidity();
                                                    }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}

                                <div className="ct-actions">
                                    <button
                                        type="submit"
                                        className="ct-button"
                                        disabled={!canSubmit}
                                        aria-disabled={!canSubmit}
                                    >
                                        {t("contact.send")}
                                    </button>
                                </div>
                            </form>
                        ) : null}
                    </div>
                </section>
            </div>
        </main>
    );
}

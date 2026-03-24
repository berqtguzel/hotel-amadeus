import React, { useEffect, useState, Fragment } from "react";
import { usePage, router } from "@inertiajs/react";
import { Dialog, Transition } from "@headlessui/react";
import "../../../css/contact.css";
import { Mail, Phone, MapPin, CheckCircle } from "lucide-react";
import { useTranslation } from "@/i18n";

function TeamCard({ photo, name, title, email, phone }) {
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
            </div>
        </article>
    );
}
const FALLBACK_EXECUTIVES = [
    {
        photo: "/images/teams/sezaikoc.png",
        name: "Sezai Koc",
        title: "Generaldirektor des Werrapark Resorts Hotel",
        email: "sezai.koc@werrapark.de",
        phone: "0170 291 8717",
    },
    {
        photo: "/images/teams/sezaikoc.png",
        name: "Özgür Akkaynak",
        title: "Operationsmanager des Werrapark Resorts Hotel",
        email: "ozgur.akkaynak@werrapark.de",
        phone: "0151 5909 8197",
    },
    {
        photo: "/images/teams/sezaikoc.png",
        name: "Christina Pahlahs",
        title: "Leiterin der Personal- und Buchhaltungsabteilung des Werrapark Resorts Hotel",
        email: "christina.pahlahs@werrapark.de",
        phone: "03684 385 568",
    },
];

const FALLBACK_RESERVATIONS = [
    {
        photo: "/images/teams/sezaikoc.png",
        name: "Christian Steinitz",
        title: "Hotelleiter",
        email: "info@werrapark.de",
        phone: "03684 93718",
    },
    {
        photo: "/images/teams/sezaikoc.png",
        name: "Christian Koch",
        title: "Verantwortlich für Buchungen – Werrapark Resorts Sommerberg Hotel",
        email: "info@werrapark-sommerberg.de",
        phone: "036870 256109",
    },
    {
        photo: "/images/teams/sezaikoc.png",
        name: "Claudia Rosendahl",
        title: "Verantwortlich für Buchungen – Werrapark Resort Heubacher Höhe Hotel",
        email: "empfang-heubach@werrapark.de",
        phone: "036874 93706",
    },
];

const DEFAULT_FIELDS = [
    { name: "name", type: "text", required: true },
    { name: "phone", type: "tel", required: false },
    { name: "email", type: "email", required: true },
    { name: "message", type: "textarea", required: true },
];

export default function ContactPage() {
    const { t } = useTranslation();
    const { props } = usePage();
    const [submitStatus, setSubmitStatus] = useState(null);
    const contactForms = props?.global?.contactForms ?? {};
    const settingsContact = props?.global?.settings?.contact ?? {};
    const locale = props?.global?.locale ?? "de";

    useEffect(() => {
        if (props?.flash?.success) {
            setSubmitStatus({ type: "success", message: props.flash.success });
        }
        const err = props?.errors?.error ?? (props?.errors && Object.values(props.errors).flat().filter(Boolean)[0]);
        if (err) {
            const msg = typeof err === "string" ? err : Array.isArray(err) ? err[0] : err?.message ?? String(err);
            if (msg) setSubmitStatus({ type: "error", message: msg });
        }
    }, [props?.flash, props?.errors]);

    useEffect(() => {
        if (submitStatus?.type !== "success") return;
        const t = setTimeout(() => {
            window.location.reload();
        }, 2000);
        return () => clearTimeout(t);
    }, [submitStatus?.type]);

    const executives = (
        contactForms.executives?.length
            ? contactForms.executives
            : FALLBACK_EXECUTIVES
    ).map((p) => ({
        photo: p.photo || "/images/teams/sezaikoc.png",
        name: p.name,
        title: p.title,
        email: p.email,
        phone: p.phone,
    }));

    const reservations = (
        contactForms.reservations?.length
            ? contactForms.reservations
            : FALLBACK_RESERVATIONS
    ).map((p) => ({
        photo: p.photo || "/images/teams/sezaikoc.png",
        name: p.name,
        title: p.title,
        email: p.email,
        phone: p.phone,
    }));

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
        "Am Kirchberg 15, 98666 Masserberg-Schnett";

    const contactInfo = {
        address: addressStr,
        phone:
            contactForms.contactInfo?.phone ||
            settingsContact.phone ||
            settingsContact.tel ||
            settingsContact.mobile ||
            "+493684205706",
        email:
            contactForms.contactInfo?.email ||
            settingsContact.email ||
            settingsContact.mail ||
            "info@werrapark.de",
        map: settingsContact.map || null,
    };

    const formFields = contactForms.formFields?.length ? contactForms.formFields : DEFAULT_FIELDS;
    const formId = contactForms.forms?.[0]?.id ?? 1;

    const onSubmit = (e) => {
        e.preventDefault();
        const form = e.target;
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
            onSuccess: () => setSubmitStatus({ type: "success", message: t("contact.success") }),
            onError: (errors) => {
                const msg = errors?.error ?? Object.values(errors || {}).flat().filter(Boolean)[0];
                setSubmitStatus({ type: "error", message: msg || t("contact.error") });
            },
        });
    };

    return (
        <main className="ct-section" id="kontakt">
            <div className="ct-container">
                <header className="ct-header">
                    <h1 className="ct-title">{t("contact.title")}</h1>
                    <p className="ct-subtitle">{t("contact.subtitle")}</p>
                </header>

                <section aria-labelledby="exec-title" className="ct-block">
                    <h2 id="exec-title" className="ct-block__title">
                        {t("contact.executives")}
                    </h2>
                    <div className="ct-grid">
                        {executives.map((p) => (
                            <TeamCard key={p.email} {...p} />
                        ))}
                    </div>
                </section>

                {/* Reservations team */}
                <section aria-labelledby="res-title" className="ct-block">
                    <h2 id="res-title" className="ct-block__title">
                        {t("contact.reservations")}
                    </h2>
                    <div className="ct-grid">
                        {reservations.map((p) => (
                            <TeamCard key={p.email} {...p} />
                        ))}
                    </div>
                </section>

                {/* Contact panel + form */}
                <section aria-labelledby="form-title" className="ct-panel">
                    <div className="ct-panel__info">
                        <h2 id="form-title" className="ct-panel__title">
                            {t("contact.formTitle")}
                        </h2>
                        <ul className="ct-info">
                            <li>
                                <MapPin size={18} />
                                <span>{contactInfo.address}</span>
                            </li>

                            <li>
                                <Phone size={18} />
                                <a
                                    href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                                >
                                    {contactInfo.phone}
                                </a>
                            </li>

                            <li>
                                <Mail size={18} />
                                <a href={`mailto:${contactInfo.email}`}>
                                    {contactInfo.email}
                                </a>
                            </li>
                        </ul>

                        {contactInfo.map ? (
                            <a
                                href={contactInfo.map}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ct-map-placeholder ct-map-placeholder--link"
                                aria-label={t("contact.mapLabel")}
                            >
                                <div className="ct-map-inner">
                                    <span className="ct-map-badge">
                                        {t("contact.mapBadge")}
                                    </span>
                                    <p className="ct-map-text">
                                        {t("contact.mapText")}
                                    </p>
                                </div>
                            </a>
                        ) : (
                            <div
                                className="ct-map-placeholder"
                                aria-label={t("contact.mapLabel")}
                            >
                                <div className="ct-map-inner">
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

                    {submitStatus?.type === "error" && (
                        <div className="ct-form-status ct-form-status--error" role="alert">
                            {submitStatus.message}
                        </div>
                    )}
                    <Transition appear show={submitStatus?.type === "success"} as={Fragment}>
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
                                <div className="ct-modal__backdrop" aria-hidden="true" />
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
                                                <CheckCircle size={56} strokeWidth={1.5} />
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
                    <form className="ct-form" onSubmit={onSubmit} noValidate>
                        {formFields.map((field) => {
                            const labelKey = `contact.${field.name}`;
                            const labelText = t(labelKey) !== labelKey ? t(labelKey) : field.label ?? field.name;
                            const placeholderKey = `contact.${field.name}Placeholder`;
                            const placeholderText = t(placeholderKey) !== placeholderKey ? t(placeholderKey) : field.placeholder ?? "";
                            return (
                                <div
                                    key={field.name}
                                    className={field.type === "textarea" ? "ct-field ct-field--full" : "ct-field"}
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
                                            placeholder={placeholderText || t("contact.messagePlaceholder")}
                                            required={field.required}
                                        />
                                    ) : (
                                        <input
                                            id={field.name}
                                            name={field.name}
                                            type={field.type || "text"}
                                            placeholder={placeholderText || (field.name === "phone" ? "+49 …" : "")}
                                            required={field.required}
                                        />
                                    )}
                                </div>
                            );
                        })}

                        <div className="ct-actions">
                            <button type="submit" className="ct-button">
                                {t("contact.send")}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}

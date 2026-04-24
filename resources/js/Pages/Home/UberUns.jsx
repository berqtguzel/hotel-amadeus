import React from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import SeoHead from "@/Components/SeoHead";
import { useTranslation } from "@/i18n";
import "../../../css/uber-uns.css";

export default function UberUns({ currentRoute = "uberuns" }) {
    const { t, locale } = useTranslation();
    const { props } = usePage();
    const page = props.page;

    // fallback + clean kullanım
    const title = page?.title ?? t("about.heroTitle");
    const subtitle = page?.subtitle ?? t("about.heroSubtitle");
    const content = page?.content ?? t("about.heroContent");
    const image = page?.heroImage ?? "/images/template2.png";

    return (
        <AppLayout currentRoute={currentRoute} headerOverlay>
            <SeoHead
                title={title}
                description={subtitle}
                image={image}
                meta={page?.meta}
            />

            <main className="uu">
                <section className="uu-hero uu-meshbg">
                    <div className="uu-hero__pattern" />

                    <div
                        className="uu-hero__bg"
                        style={{
                            backgroundImage: `url(${image})`,
                        }}
                    />

                    <div className="uu-shell uu-hero__inner">
                        <span className="uu-eyebrow">Hotel Amadeus</span>
                        <h1 className="uu-title">{title}</h1>
                        <p className="uu-sub">{subtitle}</p>
                    </div>
                </section>

                <section className="uu-shell uu-stats">
                    <div className="uu-stat">
                        <div className="uu-stat__value">105+</div>
                        <div className="uu-stat__label">
                            Menueauswahl
                        </div>
                    </div>

                    <div className="uu-stat">
                        <div className="uu-stat__value">120+</div>
                        <div className="uu-stat__label">
                            Verfuegbare Zimmer
                        </div>
                    </div>
                </section>

                <section className="uu-shell uu-split">
                    <div className="uu-pane">
                        <h1 className="uu-h2">{title}</h1>

                        <div
                            className="uu-text"
                            dangerouslySetInnerHTML={{
                                __html: content,
                            }}
                        />
                    </div>
                </section>

                <section className="uu-shell uu-values">
                    <article className="uu-value">
                        <h3>{t("about.valuesHospitalityTitle")}</h3>
                        <p>{t("about.valuesHospitalityText")}</p>
                    </article>

                    <article className="uu-value">
                        <h3>{t("about.valuesQualityTitle")}</h3>
                        <p>{t("about.valuesQualityText")}</p>
                    </article>

                    <article className="uu-value">
                        <h3>{t("about.valuesSustainabilityTitle")}</h3>
                        <p>{t("about.valuesSustainabilityText")}</p>
                    </article>
                </section>

                <section className="uu-cta">
                    <div className="uu-shell uu-cta__inner">
                        <h1 className="uu-cta__title">{t("about.ctaTitle")}</h1>

                        <p className="uu-cta__text">{t("about.ctaText")}</p>

                        <a className="uu-btn" href={`/${locale}/kontakt`}>
                            {t("about.ctaButton")}
                        </a>
                    </div>
                </section>
            </main>
        </AppLayout>
    );
}

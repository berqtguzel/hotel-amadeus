import React from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import TeamGrid from "@/Components/Home/TeamGrid";
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
        <AppLayout currentRoute={currentRoute}>
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
                        <span className="uu-eyebrow">Werrapark</span>
                        <h1 className="uu-title">{title}</h1>
                        <p className="uu-sub">{subtitle}</p>
                    </div>
                </section>

                <section className="uu-shell uu-stats">
                    <div className="uu-stat">
                        <div className="uu-stat__value">25+</div>
                        <div className="uu-stat__label">
                            {t("about.statsExperience")}
                        </div>
                    </div>

                    <div className="uu-stat">
                        <div className="uu-stat__value">300+</div>
                        <div className="uu-stat__label">
                            {t("about.statsRooms")}
                        </div>
                    </div>

                    <div className="uu-stat">
                        <div className="uu-stat__value">97%</div>
                        <div className="uu-stat__label">
                            {t("about.statsSatisfaction")}
                        </div>
                    </div>

                    <div className="uu-stat">
                        <div className="uu-stat__value">120+</div>
                        <div className="uu-stat__label">
                            {t("about.statsEmployees")}
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

                <section className="uu-shell uu-timeline">
                    <h2 className="uu-h2">{t("about.timelineTitle")}</h2>

                    <ol className="uu-steps">
                        <li className="uu-step">
                            <div className="uu-step__dot" />
                            <div className="uu-step__year">1999</div>
                            <div className="uu-step__title">
                                {t("about.timeline1Title")}
                            </div>
                            <div className="uu-step__text">
                                {t("about.timeline1Text")}
                            </div>
                        </li>

                        <li className="uu-step">
                            <div className="uu-step__dot" />
                            <div className="uu-step__year">2008</div>
                            <div className="uu-step__title">
                                {t("about.timeline2Title")}
                            </div>
                            <div className="uu-step__text">
                                {t("about.timeline2Text")}
                            </div>
                        </li>

                        <li className="uu-step">
                            <div className="uu-step__dot" />
                            <div className="uu-step__year">2017</div>
                            <div className="uu-step__title">
                                {t("about.timeline3Title")}
                            </div>
                            <div className="uu-step__text">
                                {t("about.timeline3Text")}
                            </div>
                        </li>

                        <li className="uu-step">
                            <div className="uu-step__dot" />
                            <div className="uu-step__year">2024</div>
                            <div className="uu-step__title">
                                {t("about.timeline4Title")}
                            </div>
                            <div className="uu-step__text">
                                {t("about.timeline4Text")}
                            </div>
                        </li>
                    </ol>
                </section>

                <section className="uu-team">
                    <TeamGrid />
                </section>

                <section className="uu-cta">
                    <div className="uu-shell uu-cta__inner">
                        <h2 className="uu-cta__title">{t("about.ctaTitle")}</h2>

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

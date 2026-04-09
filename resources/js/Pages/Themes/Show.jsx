import React from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import "@/../css/theme-detail.css";
import SeoHead from "@/Components/SeoHead";
import { useTranslation } from "@/i18n";

export default function ThemeShow({ theme }) {
    const { props } = usePage();
    const { t } = useTranslation();
    const locale = props?.locale ?? props?.global?.locale ?? "de";
    const themes = props?.themes?.length ? props.themes : [];

    const data =
        themes.find((item) => {
            const slug = item.slug || item.id;
            return String(item.id) === String(theme) || slug === String(theme);
        }) ?? null;

    if (!data) {
        return null;
    }

    const intro = data.description || "";
    const title = data.name || "";
    const image = data.image || "";
    const file = data.file || null;

    return (
        <AppLayout currentRoute="urlaubsthemen">
            <SeoHead title={title} description={intro} image={image} />
            <section className="td-wrap" aria-labelledby="theme-title">
                <div className="td-hero">
                    <div className="td-hero-inner">
                        <div className="td-hero-layout">
                            <div className="td-hero-copy">
                                <p className="td-eyebrow">
                                    {t("themeDetail.eyebrow")}{" "}
                                    • Werrapark Resort
                                </p>
                                <h1 id="theme-title" className="td-title">
                                    {title}
                                </h1>
                            </div>

                            {image ? (
                                <div
                                    className="td-hero-media"
                                    aria-hidden="true"
                                >
                                    <div className="td-hero-img-wrap">
                                        <img
                                            src={image}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <span className="td-hero-grad" />
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="td-layout">
                    <article className="td-main">
                        <div className="td-card">
                            <h2 className="td-card-title">
                                {t("themeDetail.mainTitle")}
                            </h2>
                            <div
                                className="td-text"
                                dangerouslySetInnerHTML={{ __html: intro }}
                            />
                        </div>
                    </article>

                    <aside
                        className="td-aside"
                        aria-label={t("themeDetail.asideAria")}
                    >
                        <div className="td-aside-card">
                            <h2 className="td-aside-title">
                                {t("themeDetail.asideTitle")}
                            </h2>
                            <p className="td-text">
                                {t("themeDetail.asideText")}
                            </p>
                            <div className="td-actions">
                                <a
                                    href={`/${locale}/kontakt`}
                                    className="td-btn td-btn--primary"
                                >
                                    {t("themeDetail.contactBtn")}
                                </a>
                                {file ? (
                                    <a
                                        href={file}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="td-btn td-btn--ghost"
                                    >
                                        {t("themeDetail.openFileBtn")}
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </AppLayout>
    );
}

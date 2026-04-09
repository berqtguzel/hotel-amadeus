import React from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import SeoHead from "@/Components/SeoHead";
import "../../../css/dynamic-page.css";

export default function DynamicPage({ currentRoute = "page" }) {
    const { props } = usePage();
    const page = props?.page ?? {};
    const rawGalleries = Array.isArray(props?.galleries) ? props.galleries : [];

    const { title = "Seite", subtitle = "", blocks = [], content = "" } = page;

    const hasBlocks = Array.isArray(blocks) && blocks.length > 0;
    const isGalleryPage = ["galerie", "gallery"].includes(
        String(page?.slug || "").toLowerCase(),
    );

    const galleryImages = React.useMemo(() => {
        return rawGalleries.flatMap((gallery, galleryIndex) => {
            const images = Array.isArray(gallery?.images) ? gallery.images : [];
            return images
                .filter((image) => Boolean(image?.url))
                .map((image, imageIndex) => ({
                    id:
                        image.id ??
                        `${gallery?.id ?? `gallery-${galleryIndex}`}-${imageIndex}`,
                    url: image.url,
                    alt: gallery?.name || title,
                }));
        });
    }, [rawGalleries, title]);

    const heroSrc = page.heroImage || "/images/template1.webp";

    return (
        <AppLayout currentRoute={currentRoute}>
            <SeoHead
                title={title}
                description={subtitle}
                image={heroSrc}
                meta={page?.meta}
            />

            <div className="dp-wrapper">
                <section className="dp-hero">
                    <div
                        className="dp-hero__bg"
                        style={{ backgroundImage: `url(${heroSrc})` }}
                    />

                    <div className="dp-hero__overlay" />

                    <div className="dp-hero__inner">
                        <span className="dp-eyebrow">Werrapark Resort</span>

                        <h1 className="dp-title">{title}</h1>

                        {subtitle && <p className="dp-subtitle">{subtitle}</p>}
                    </div>
                </section>

                {isGalleryPage ? (
                    <section className="dp-content dp-content--gallery">
                        <div className="dp-container dp-container--gallery">
                            {galleryImages.length === 0 ? (
                                <div className="dp-card dp-empty">
                                    <p>Galerie görselleri bulunamadı.</p>
                                </div>
                            ) : (
                                <div className="dp-gallery-grid">
                                    {galleryImages.map((image) => (
                                        <figure
                                            className="dp-gallery-card"
                                            key={image.id}
                                        >
                                            <img
                                                src={image.url}
                                                alt={image.alt}
                                                loading="lazy"
                                            />
                                        </figure>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                ) : (
                    <section className="dp-content">
                        <div className="dp-container">
                            {!hasBlocks && content && (
                                <div
                                    className="dp-card dp-richtext"
                                    dangerouslySetInnerHTML={{ __html: content }}
                                />
                            )}

                            {!hasBlocks && !content && (
                                <div className="dp-card dp-empty">
                                    <p>
                                        Diese Seite wird aktuell vorbereitet.
                                        Bald finden Sie hier spannende Inhalte
                                        rund um {title}.
                                    </p>
                                </div>
                            )}

                            {hasBlocks &&
                                blocks.map((b, i) => {
                                    if (b.type === "text") {
                                        return (
                                            <div key={i} className="dp-card">
                                                {b.heading && <h2>{b.heading}</h2>}
                                                {b.html ? (
                                                    <div
                                                        className="dp-richtext"
                                                        dangerouslySetInnerHTML={{
                                                            __html: b.html,
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="dp-richtext">
                                                        {b.content}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    if (b.type === "image") {
                                        return (
                                            <div
                                                key={i}
                                                className="dp-card dp-image"
                                            >
                                                <img
                                                    src={b.src}
                                                    alt={b.alt || ""}
                                                    loading="lazy"
                                                />
                                            </div>
                                        );
                                    }

                                    if (b.type === "list") {
                                        return (
                                            <div key={i} className="dp-card">
                                                {b.heading && <h2>{b.heading}</h2>}
                                                <ul>
                                                    {(b.items || []).map(
                                                        (item, idx) => (
                                                            <li key={idx}>
                                                                {item}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        );
                                    }

                                    return null;
                                })}
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}

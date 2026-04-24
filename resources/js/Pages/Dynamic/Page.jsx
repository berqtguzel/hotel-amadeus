import React from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import SeoHead from "@/Components/SeoHead";
import "../../../css/dynamic-page.css";

export default function DynamicPage({ currentRoute = "page" }) {
    const { props } = usePage();
    const page = props?.page ?? {};
    const rawGalleries = Array.isArray(props?.galleries) ? props.galleries : [];

    const { title = "Seite", subtitle = "", content = "" } = page;
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

    /* ğŸ”¥ MODAL STATE */
    const [activeIndex, setActiveIndex] = React.useState(null);

    const closeModal = () => setActiveIndex(null);

    const nextImage = () =>
        setActiveIndex((prev) =>
            prev === galleryImages.length - 1 ? 0 : prev + 1,
        );

    const prevImage = () =>
        setActiveIndex((prev) =>
            prev === 0 ? galleryImages.length - 1 : prev - 1,
        );

    /* ğŸ”¥ KEYBOARD CONTROL */
    React.useEffect(() => {
        const handleKey = (e) => {
            if (activeIndex === null) return;

            if (e.key === "Escape") closeModal();
            if (e.key === "ArrowRight") nextImage();
            if (e.key === "ArrowLeft") prevImage();
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [activeIndex]);

    return (
        <AppLayout currentRoute={currentRoute} headerOverlay>
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
                    <div className="dp-hero__grid" />

                    <div className="dp-hero__inner">
                        <span className="dp-eyebrow">Hotel Amadeus</span>
                        <h1 className="dp-title">{title}</h1>
                        {subtitle && <p className="dp-subtitle">{subtitle}</p>}
                    </div>
                </section>

                {isGalleryPage ? (
                    <section className="dp-content dp-content--gallery">
                        <div className="dp-container dp-container--gallery">
                            {galleryImages.length === 0 ? (
                                <div className="dp-card dp-empty">
                                    <p>Galerie bilder wurden nicht gefunden.</p>
                                </div>
                            ) : (
                                <div className="dp-gallery-grid">
                                    {galleryImages.map((image, index) => (
                                        <figure
                                            className="dp-gallery-card cursor-target"
                                            key={image.id}
                                        >
                                            <img
                                                src={image.url}
                                                alt={image.alt}
                                                loading="lazy"
                                                onClick={() =>
                                                    setActiveIndex(index)
                                                }
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
                            {content && (
                                <div
                                    className="dp-card dp-richtext"
                                    dangerouslySetInnerHTML={{
                                        __html: content,
                                    }}
                                />
                            )}

                            {!content && (
                                <div className="dp-card dp-empty">
                                    <p>
                                        Diese Seite wird aktuell vorbereitet.
                                        Bald finden Sie hier spannende Inhalte
                                        rund um {title}.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {activeIndex !== null && (
                    <div
                        className="dp-modal cursor-target"
                        onClick={closeModal}
                    >
                        <div
                            className="dp-modal-inner"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={galleryImages[activeIndex].url}
                                alt=""
                                className="dp-modal-img cursor-target"
                            />

                            <button
                                className="dp-close cursor-target"
                                onClick={closeModal}
                                aria-label="Close"
                            >
                                <span />
                                <span />
                            </button>

                            <button
                                className="dp-nav dp-prev cursor-target"
                                onClick={prevImage}
                                aria-label="Previous image"
                            >
                                ‹
                            </button>

                            <button
                                className="dp-nav dp-next cursor-target"
                                onClick={nextImage}
                                aria-label="Next image"
                            >
                                ›
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/i18n";
import "../../../css/reviews-page.css";
import HotelReviews from "../Home/HotelReviews";
import { usePage } from "@inertiajs/react";

const Index = () => {
    const props = usePage().props;
    const { t } = useTranslation();
    const [form, setForm] = useState({
        name: "",
        email: "",
        message: "",
        rating: 5,
    });
    const language = props.locale;

    const [criteria, setCriteria] = useState([]);
    const [criteriaRatings, setCriteriaRatings] = useState({});

    // UI için hover state'i (Hem genel yıldızlar hem kriter yıldızları için)
    const [hoverRating, setHoverRating] = useState(0);
    const [hoverCriteria, setHoverCriteria] = useState({});

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    useEffect(() => {
        const fetchCriteria = async () => {
            try {
                const res = await fetch("/api/reviews/criteria");
                if (res.ok) {
                    const data = await res.json();
                    const fetchedCriteria = data?.data?.criteria || [];
                    setCriteria(fetchedCriteria);

                    if (fetchedCriteria.length > 0) {
                        const initialRatings = {};
                        fetchedCriteria.forEach((c) => {
                            initialRatings[c.id] = 5; // UI'da 5 yıldız
                        });
                        setCriteriaRatings(initialRatings);
                    }
                }
            } catch (error) {
                console.error("Criteria fetch error:", error);
            }
        };

        fetchCriteria();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCriteriaRatingChange = (criteriaId, starValue) => {
        setCriteriaRatings((prev) => ({
            ...prev,
            [criteriaId]: starValue,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: "", message: "" });

        // API'ye gönderilecek kriter puanlarını 1-10 skalasına çevir (Yıldız x 2)
        const formattedCriteriaRatings = {};
        if (criteria.length > 0) {
            Object.keys(criteriaRatings).forEach((key) => {
                formattedCriteriaRatings[key] = criteriaRatings[key] * 2;
            });
        }

        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content"),
                },
                body: JSON.stringify({
                    author_name: form.name,
                    author_email: form.email,
                    content: form.message,
                    // Eğer kriter varsa kriterleri, yoksa genel puanı gönder
                    ...(criteria.length > 0
                        ? { criteria_ratings: formattedCriteriaRatings }
                        : { rating: form.rating }),
                }),
            });

            if (res.ok) {
                setStatus({
                    type: "success",
                    message: t("reviews.success"),
                });
                setForm({
                    name: "",
                    email: "",
                    message: "",
                    rating: 5,
                });

                // Kriterleri tekrar sıfırla
                if (criteria.length > 0) {
                    const resetRatings = {};
                    criteria.forEach((c) => (resetRatings[c.id] = 5));
                    setCriteriaRatings(resetRatings);
                }

                // Başarılı gönderimden sonra sayfayı yenile
                window.setTimeout(() => {
                    if (typeof window !== "undefined") {
                        window.location.reload();
                    }
                }, 800);
            } else {
                setStatus({
                    type: "error",
                    message: t("reviews.error"),
                });
            }
        } catch (error) {
            setStatus({
                type: "error",
                message: t("reviews.serverError"),
            });
        } finally {
            setLoading(false);
        }
    };

    const getCriteriaName = (criterion) => {
        const currentLang = language;

        const translation = criterion.translations?.find(
            (tr) => tr.language_code === currentLang,
        );

        return translation?.name || criterion.name;
    };

    return (
        <>
            <section className="review-page">
                <div className="review-bg-shape review-bg-shape-1"></div>
                <div className="review-bg-shape review-bg-shape-2"></div>
                <div className="review-bg-grid"></div>

                <div className="review-container">
                    <div className="review-card">
                        <div className="review-card-top">
                            <div>
                                <span className="mini-label">
                                    {t("reviews.formMiniLabel")}
                                </span>
                                <h2>{t("reviews.formTitle")}</h2>
                                <p>{t("reviews.formSubtitle")}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="review-form">
                            <div className="review-form-grid">
                                <div className="input-group">
                                    <label htmlFor="name">
                                        {t("reviews.labelName")}
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder={t(
                                            "reviews.placeholderName",
                                        )}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label htmlFor="email">
                                        {t("reviews.labelEmail")}
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder={t(
                                            "reviews.placeholderEmail",
                                        )}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="ratings-container">
                                {criteria.length > 0 ? (
                                    <>
                                        <h3
                                            style={{
                                                marginBottom: "15px",
                                                fontSize: "1.1rem",
                                            }}
                                        >
                                            {t("reviews.labelRating")}
                                        </h3>
                                        <div className="ratings-grid">
                                            {criteria.map((criterion) => (
                                                <div
                                                    key={criterion.id}
                                                    className="rating-panel"
                                                    style={{
                                                        marginBottom: "10px",
                                                        padding: "10px",
                                                        background:
                                                            "rgba(0,0,0,0.02)",
                                                        borderRadius: "8px",
                                                    }}
                                                >
                                                    <div className="rating-texts">
                                                        <span
                                                            className="rating-title"
                                                            style={{
                                                                fontSize:
                                                                    "1rem",
                                                            }}
                                                        >
                                                            {getCriteriaName(
                                                                criterion,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="star-rating">
                                                        {[1, 2, 3, 4, 5].map(
                                                            (star) => (
                                                                <button
                                                                    type="button"
                                                                    key={star}
                                                                    className={`star ${
                                                                        star <=
                                                                        (hoverCriteria[
                                                                            criterion
                                                                                .id
                                                                        ] ||
                                                                            criteriaRatings[
                                                                                criterion
                                                                                    .id
                                                                            ])
                                                                            ? "filled"
                                                                            : ""
                                                                    }`}
                                                                    onClick={() =>
                                                                        handleCriteriaRatingChange(
                                                                            criterion.id,
                                                                            star,
                                                                        )
                                                                    }
                                                                    onMouseEnter={() =>
                                                                        setHoverCriteria(
                                                                            {
                                                                                ...hoverCriteria,
                                                                                [criterion.id]:
                                                                                    star,
                                                                            },
                                                                        )
                                                                    }
                                                                    onMouseLeave={() =>
                                                                        setHoverCriteria(
                                                                            {
                                                                                ...hoverCriteria,
                                                                                [criterion.id]: 0,
                                                                            },
                                                                        )
                                                                    }
                                                                    aria-label={`${star} ${t("reviews.ariaStars")}`}
                                                                >
                                                                    ★
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="rating-panel">
                                        <div className="rating-texts">
                                            <span className="rating-title">
                                                {t("reviews.labelRating")}
                                            </span>
                                            <span className="rating-subtitle">
                                                {t("reviews.ratingInstruction")}
                                            </span>
                                        </div>

                                        <div className="star-rating">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    type="button"
                                                    key={star}
                                                    className={`star ${
                                                        star <=
                                                        (hoverRating ||
                                                            form.rating)
                                                            ? "filled"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        setForm({
                                                            ...form,
                                                            rating: star,
                                                        })
                                                    }
                                                    onMouseEnter={() =>
                                                        setHoverRating(star)
                                                    }
                                                    onMouseLeave={() =>
                                                        setHoverRating(0)
                                                    }
                                                    aria-label={`${star} ${t("reviews.ariaStars")}`}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="input-group textarea-group">
                                <label htmlFor="message">
                                    {t("reviews.labelMessage")}
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder={t(
                                        "reviews.placeholderMessage",
                                    )}
                                    required
                                />
                            </div>

                            <div className="review-actions">
                                <button
                                    type="submit"
                                    className={`submit-btn ${loading ? "loading" : ""}`}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner"></span>
                                            {t("reviews.btnSending")}
                                        </>
                                    ) : (
                                        t("reviews.btnSubmit")
                                    )}
                                </button>
                            </div>

                            {status.message && (
                                <div className={`status-msg ${status.type}`}>
                                    {status.message}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </section>

            <HotelReviews />
        </>
    );
};

export default Index;

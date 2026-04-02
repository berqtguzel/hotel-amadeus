import React, { useEffect, useState } from "react";
import { useTranslation } from "@/i18n";
import "../../../css/reviews-page.css";
import HotelReviews from "../Home/HotelReviews";
import { usePage } from "@inertiajs/react";

const Index = () => {
    const { reviews, criteria = [] } = usePage().props;
    const { t } = useTranslation();

    const buildInitialRatings = () => {
        const obj = {};
        criteria.forEach((c) => {
            obj[c.name] = 0;
        });
        return obj;
    };

    const [form, setForm] = useState({
        name: "",
        email: "",
        message: "",
        ratings: buildInitialRatings(),
    });

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    // 🔥 criteria değişirse resetle
    useEffect(() => {
        setForm((prev) => ({
            ...prev,
            ratings: buildInitialRatings(),
        }));
    }, [criteria]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleRating = (key, value) => {
        setForm((prev) => ({
            ...prev,
            ratings: {
                ...prev.ratings,
                [key]: value,
            },
        }));
    };

    const getAverage = () => {
        const values = Object.values(form.ratings);
        const valid = values.filter((v) => v > 0);

        if (!valid.length) return 0;

        return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: "", message: "" });

        const cleanRatings = Object.fromEntries(
            Object.entries(form.ratings).filter(([_, v]) => v > 0),
        );

        if (Object.keys(cleanRatings).length === 0) {
            setStatus({
                type: "error",
                message: "Lütfen en az bir değerlendirme seçin",
            });
            setLoading(false);
            return;
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
                    ratings: cleanRatings,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({
                    type: "success",
                    message: data.message || t("reviews.success"),
                });

                setForm({
                    name: "",
                    email: "",
                    message: "",
                    ratings: buildInitialRatings(),
                });
            } else {
                setStatus({
                    type: "error",
                    message: data.message || t("reviews.error"),
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

    return (
        <>
            <section className="review-page">
                <div className="review-bg-shape review-bg-shape-1"></div>
                <div className="review-bg-shape review-bg-shape-2"></div>
                <div className="review-bg-grid"></div>

                <div className="review-container">
                    <div className="review-hero">
                        <div className="review-badge">
                            {t("reviews.heroBadge")}
                        </div>
                        <h1>{t("reviews.heroTitle")}</h1>
                        <p>{t("reviews.heroSubtitle")}</p>

                        <div className="review-hero-stats">
                            <div className="hero-stat-card">
                                <strong>5★</strong>
                                <span>{t("reviews.statSatisfaction")}</span>
                            </div>
                            <div className="hero-stat-card">
                                <strong>{t("reviews.statFast")}</strong>
                                <span>{t("reviews.statFastDesc")}</span>
                            </div>
                            <div className="hero-stat-card">
                                <strong>{t("reviews.statSecure")}</strong>
                                <span>{t("reviews.statSecureDesc")}</span>
                            </div>
                        </div>
                    </div>

                    <div className="review-card">
                        <div className="review-card-top">
                            <div>
                                <span className="mini-label">
                                    {t("reviews.formMiniLabel")}
                                </span>
                                <h2>{t("reviews.formTitle")}</h2>
                                <p>{t("reviews.formSubtitle")}</p>
                            </div>

                            <div className="review-score-box">
                                <span>{t("reviews.selectedScore")}</span>
                                <strong>{getAverage()}.0</strong>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="review-form">
                            <div className="review-form-grid">
                                <div className="input-group">
                                    <label>{t("reviews.labelName")}</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label>{t("reviews.labelEmail")}</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* 🔥 DYNAMIC CRITERIA */}
                            {criteria.map((c) => (
                                <div className="rating-panel" key={c.id}>
                                    <div className="rating-texts">
                                        <span className="rating-title">
                                            {c.name}
                                        </span>
                                    </div>

                                    <div className="star-rating">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                                            (num) => (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    className={`star ${
                                                        form.ratings[c.name] ===
                                                        num
                                                            ? "filled"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        handleRating(
                                                            c.name,
                                                            num,
                                                        )
                                                    }
                                                >
                                                    {num}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="input-group textarea-group">
                                <label>{t("reviews.labelMessage")}</label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="review-actions">
                                <button
                                    type="submit"
                                    className={`submit-btn ${loading ? "loading" : ""}`}
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Sending..."
                                        : t("reviews.btnSubmit")}
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

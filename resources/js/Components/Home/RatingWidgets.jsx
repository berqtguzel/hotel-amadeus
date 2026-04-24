import React from "react";
import { usePage } from "@inertiajs/react";
import "../../../css/RatingWidgets.css";

const RatingWidgets = () => {
    const ratings = usePage().props.global?.ratings?.ratings || [];
    const [marqueeEnabled, setMarqueeEnabled] = React.useState(false);

    React.useEffect(() => {
        if (typeof window === "undefined") return undefined;

        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const pointerQuery = window.matchMedia("(pointer: fine) and (hover: hover)");

        const syncMarqueeState = () => {
            setMarqueeEnabled(
                ratings.length > 2 &&
                    pointerQuery.matches &&
                    !motionQuery.matches,
            );
        };

        syncMarqueeState();
        motionQuery.addEventListener("change", syncMarqueeState);
        pointerQuery.addEventListener("change", syncMarqueeState);

        return () => {
            motionQuery.removeEventListener("change", syncMarqueeState);
            pointerQuery.removeEventListener("change", syncMarqueeState);
        };
    }, [ratings.length]);

    if (!ratings.length) return null;

    const renderStars = (score) => {
        return [1, 2, 3, 4, 5].map((i) => (
            <span
                key={i}
                className={
                    score >= i
                        ? "star filled"
                        : score >= i - 0.5
                          ? "star half"
                          : "star"
                }
            >
                ★
            </span>
        ));
    };

    return (
        <div
            className={`rw-marquee ${marqueeEnabled ? "is-animated" : "is-static"}`}
        >
            <div className="rw-track">
                {(marqueeEnabled ? [...ratings, ...ratings] : ratings).map((item, i) => (
                    <a
                        key={i}
                        href={item.source_url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="rw-card-equal"
                    >
                        <img src={item.logo_url} alt="" />

                        <div className="rw-info">
                            <div className="rw-title">{item.platform_name}</div>
                            <div className="rw-stars">
                                {renderStars(item.rating_normalized || 0)}
                            </div>
                        </div>

                        <div className="rw-score">{item.display}</div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default RatingWidgets;

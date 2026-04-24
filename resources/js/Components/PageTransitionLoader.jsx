import React, { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { useTranslation } from "@/i18n";

const MIN_VISIBLE_MS = 520;
const COMPLETE_DELAY_MS = 180;
const EXIT_DURATION_MS = 360;
const PROGRESS_INTERVAL_MS = 120;

export default function PageTransitionLoader() {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(0);

    const startedAtRef = useRef(0);
    const activeVisitsRef = useRef(0);
    const progressIntervalRef = useRef(null);
    const completeTimeoutRef = useRef(null);
    const hideTimeoutRef = useRef(null);

    const clearProgressInterval = () => {
        if (progressIntervalRef.current) {
            window.clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    };

    const clearTimeouts = () => {
        if (completeTimeoutRef.current) {
            window.clearTimeout(completeTimeoutRef.current);
            completeTimeoutRef.current = null;
        }

        if (hideTimeoutRef.current) {
            window.clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    };

    const resetLoader = () => {
        clearProgressInterval();
        clearTimeouts();
        setIsVisible(false);
        setIsExiting(false);
        setProgress(0);
        startedAtRef.current = 0;
    };

    const startLoader = () => {
        activeVisitsRef.current += 1;
        clearProgressInterval();
        clearTimeouts();

        startedAtRef.current = Date.now();
        setIsVisible(true);
        setIsExiting(false);
        setProgress(14);

        progressIntervalRef.current = window.setInterval(() => {
            setProgress((current) => {
                if (current >= 88) {
                    return current;
                }

                const increment = Math.max(1.25, (92 - current) * 0.08);
                return Math.min(88, current + increment);
            });
        }, PROGRESS_INTERVAL_MS);
    };

    const finishLoader = () => {
        activeVisitsRef.current = Math.max(0, activeVisitsRef.current - 1);

        if (activeVisitsRef.current > 0 || startedAtRef.current === 0) {
            return;
        }

        clearProgressInterval();

        const elapsed = Date.now() - startedAtRef.current;
        const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

        completeTimeoutRef.current = window.setTimeout(() => {
            setProgress(100);
            setIsExiting(true);

            hideTimeoutRef.current = window.setTimeout(() => {
                resetLoader();
            }, COMPLETE_DELAY_MS + EXIT_DURATION_MS);
        }, remaining);
    };

    useEffect(() => {
        const removeStart = router.on("start", startLoader);
        const removeProgress = router.on("progress", (event) => {
            const percentage = event?.detail?.progress?.percentage;

            if (typeof percentage === "number") {
                setProgress((current) =>
                    Math.max(current, Math.min(94, percentage)),
                );
            }
        });
        const removeFinish = router.on("finish", finishLoader);
        const removeError = router.on("error", finishLoader);
        const removeInvalid = router.on("invalid", finishLoader);
        const removeException = router.on("exception", finishLoader);

        return () => {
            removeStart?.();
            removeProgress?.();
            removeFinish?.();
            removeError?.();
            removeInvalid?.();
            removeException?.();
            resetLoader();
        };
    }, []);

    if (!isVisible) {
        return null;
    }

    return (
        <div
            className={`page-transition-loader ${isExiting ? "is-exiting" : ""}`}
            aria-live="polite"
            aria-busy={isVisible}
            role="status"
        >
            <div className="page-transition-loader__progress-track">
                <span
                    className="page-transition-loader__progress-bar"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="page-transition-loader__backdrop" />

            <div className="page-transition-loader__content">
                <div
                    className="page-transition-loader__spinner"
                    aria-hidden="true"
                />

                <div className="page-transition-loader__copy">
                    <span className="page-transition-loader__label">
                        {t("loader.brand")}
                    </span>
                    <strong className="page-transition-loader__title">
                        {t("loader.loading")}
                    </strong>
                </div>
            </div>
        </div>
    );
}

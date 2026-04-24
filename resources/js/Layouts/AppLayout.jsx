import Ribbons from "@/Components/ReactBits/Animations/Ribbons";
import { createPortal } from "react-dom";
import React, { useEffect, useState } from "react";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";
import CookieConsent from "@/Components/CookieConsent";
import WhatsAppWidget from "@/Components/WhatsAppWidget";
import { ThemeProvider } from "@/Context/ThemeContext";
import { lazy, Suspense } from "react";

export default function AppLayout({
    children,
    currentRoute,
    headerOverlay = false,
}) {
    const [isClient, setIsClient] = useState(false);
    const [shouldUseTargetCursor, setShouldUseTargetCursor] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return undefined;

        const finePointerQuery = window.matchMedia(
            "(pointer: fine) and (hover: hover)",
        );
        const reducedMotionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );
        const mobileQuery = window.matchMedia("(max-width: 768px)");

        const syncCursorAvailability = () => {
            setShouldUseTargetCursor(
                finePointerQuery.matches && !reducedMotionQuery.matches,
            );
        };

        const handleMobileChange = (e) => {
            setIsMobile(e.matches);
        };

        // Başlangıç değerlerini ata
        syncCursorAvailability();
        setIsMobile(mobileQuery.matches);

        // Dinleyicileri ekle
        finePointerQuery.addEventListener("change", syncCursorAvailability);
        reducedMotionQuery.addEventListener("change", syncCursorAvailability);
        mobileQuery.addEventListener("change", handleMobileChange);

        return () => {
            finePointerQuery.removeEventListener(
                "change",
                syncCursorAvailability,
            );
            reducedMotionQuery.removeEventListener(
                "change",
                syncCursorAvailability,
            );
            mobileQuery.removeEventListener("change", handleMobileChange);
        };
    }, [isClient]);

    return (
        <ThemeProvider>
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    zIndex: 20,
                }}
            >
                {/* Mobilde değilsek ve isClient true ise Ribbons'u göster */}
                {isClient && !isMobile && (
                    <Suspense fallback={null}>
                        <div
                            className="ribbons-container"
                            style={{
                                position: "fixed",
                                inset: 0,
                                zIndex: 10, // 👈 EN KRİTİK
                                overflow: "hidden",
                                pointerEvents: "none",
                            }}
                        >
                            <Ribbons
                                colors={["#C5A16A"]}
                                baseSpring={0.03}
                                baseFriction={0.9}
                                offsetFactor={0.05}
                                maxAge={500}
                                pointCount={50}
                                enableShaderEffect={false}
                                effectAmplitude={2}
                                speedMultiplier={0.4}
                                baseThickness={20}
                                enableFade={true}
                            />
                        </div>
                    </Suspense>
                )}

                {isClient && <Header currentRoute={currentRoute} />}

                <main
                    style={{
                        flex: 1,
                        paddingTop: isClient
                            ? headerOverlay
                                ? "0px"
                                : "0px"
                            : "0px",
                    }}
                >
                    {children}
                </main>

                {isClient && (
                    <>
                        <Footer />
                        <WhatsAppWidget />
                        <CookieConsent />
                    </>
                )}
            </div>
        </ThemeProvider>
    );
}

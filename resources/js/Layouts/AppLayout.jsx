import Ribbons from "@/Components/ReactBits/Animations/Ribbons";
import React, { Suspense, useEffect, useState } from "react";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";
import CookieConsent from "@/Components/CookieConsent";
import WhatsAppWidget from "@/Components/WhatsAppWidget";
import { ThemeProvider } from "@/Context/ThemeContext";

export default function AppLayout({
    children,
    currentRoute,
    headerOverlay = false,
}) {
    const [isClient, setIsClient] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return undefined;

        const mobileQuery = window.matchMedia("(max-width: 768px)");
        const handleMobileChange = (event) => setIsMobile(event.matches);

        setIsMobile(mobileQuery.matches);
        mobileQuery.addEventListener("change", handleMobileChange);

        return () => {
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
                {isClient && !isMobile && (
                    <Suspense fallback={null}>
                        <div
                            className="ribbons-container"
                            style={{
                                position: "fixed",
                                inset: 0,
                                zIndex: 10,
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

                <main style={{ flex: 1, paddingTop: "0px" }}>{children}</main>

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

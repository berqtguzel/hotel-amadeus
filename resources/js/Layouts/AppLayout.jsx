import React, { useEffect, useState } from "react";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";
import CookieConsent from "@/Components/CookieConsent";
import WhatsAppWidget from "@/Components/WhatsAppWidget";
import { ThemeProvider } from "@/Context/ThemeContext";
import { lazy, Suspense } from "react";
const TargetCursor = lazy(
    () => import("@/Components/ReactBits/Animations/TargetCursor"),
);

export default function AppLayout({ children, currentRoute }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <ThemeProvider>
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {isClient && (
                    <Suspense fallback={null}>
                        <TargetCursor
                            targetSelector="a, button, [role='button'], input, textarea, select, summary, .cursor-target"
                            spinDuration={2.2}
                            hoverDuration={0.22}
                            parallaxOn
                            hideDefaultCursor
                        />
                    </Suspense>
                )}
                {isClient && <Header currentRoute={currentRoute} />}

                <main
                    style={{
                        flex: 1,
                        paddingTop: isClient ? "150px" : "0px",
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

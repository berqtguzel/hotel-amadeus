import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import SeoHead from "@/Components/SeoHead";
import Hero from "@/Components/hero";
import Hotels from "@/Components/Home/Hotels";

import TeamGrid from "@/Components/Home/TeamGrid";
import VideoPromo from "@/Components/Home/VideoPromo";
import OffersGrid from "@/Components/Home/OffersGrid";
import GiftVoucherPromo from "@/Components/Home/GiftVoucherPromo";
import ExperienceHero from "@/Components/Home/ExperienceHero";
import RoomsShowcase from "@/Components/Home/RoomsShowcase";
import TravelThemes from "@/Components/Home/TravelThemes";
import HotelReviews from "@/Components/Home/HotelReviews";
import MapSection from "@/Components/Home/MapSection";
import RatingWidgets from "@/Components/Home/RatingWidgets";

export default function HomeIndex({ currentRoute = "home" }) {
    return (
        <AppLayout currentRoute={currentRoute}>
            <SeoHead />
            <Hero />
            <RatingWidgets />
            <GiftVoucherPromo />
            <Hotels />
            {/* <TeamGrid colors={["#34d399", "#60a5fa", "#a5f3fc", "#bef264"]} /> */}
            {/* <VideoPromo
                title="Schauen Sie sich unser Werbevideo an"
                poster="/images/Thumbnail2.webp"
                videoId="Im4qJM0N0c8"
                alt="Hotel Amadeus Resort – Werbevideo"
            /> */}
            {/* <OffersGrid /> */}
            <ExperienceHero />
            <RoomsShowcase />
            {/* <TravelThemes /> */}
            <HotelReviews />
            <MapSection />
        </AppLayout>
    );
}

import React from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import ContactSection from "@/Components/Contact/ContactSection";
import SeoHead from "@/Components/SeoHead";
import { useTranslation } from "@/i18n";

export default function KontaktPage({ currentRoute = "kontakt" }) {
    const { t } = useTranslation();
    const { props } = usePage();
    const page = props?.page ?? null;

    const title = page?.title ?? t("contact.title");
    const description =
        page?.meta?.description ??
        page?.meta?.meta_description ??
        page?.subtitle ??
        null;
    const image = page?.heroImage ?? null;

    return (
        <AppLayout currentRoute={currentRoute}>
            <SeoHead
                title={title}
                description={description}
                image={image}
                meta={page?.meta}
            />
            <ContactSection />
        </AppLayout>
    );
}



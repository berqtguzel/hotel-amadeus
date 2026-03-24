import React from "react";
import "../../../css/team-grid.css";
import demoTeam from "@/Data/demoData";
import { useTranslation } from "@/i18n";
import { usePage } from "@inertiajs/react";
import { Phone, Mail, Globe } from "lucide-react";
const Particles = React.lazy(() =>
    import("../ReactBits/Backgrounds/Particles").then((m) => ({
        default: m.default || m,
    })),
);
const norm = (s = "") =>
    s
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();

function TeamMedia({ src, name }) {
    return (
        <div className="tg-media">
            <img
                src={src}
                alt={`${name || "Profil"} image`}
                className="tg-media__img"
            />
            <span className="tg-media__overlay" aria-hidden="true" />
            <span className="tg-media__shine" aria-hidden="true" />
            <span className="tg-media__name">{name}</span>
        </div>
    );
}
function CardInfo({ title, email, phone, website }) {
    const { t } = useTranslation();
    return (
        <div className="tg-info">
            {title && (
                <div className="tg-info__title">
                    {String(title).replace(/\n/g, " - ")}
                </div>
            )}

            <div className="tg-contacts">
                {phone && (
                    <a
                        className="tg-chip tg-chip--link"
                        href={`tel:${phone}`}
                        aria-label={t("team.call")}
                    >
                        <Phone size={14} strokeWidth={2} />
                        <span>{phone}</span>
                    </a>
                )}

                {email && (
                    <a
                        className="tg-chip tg-chip--link"
                        href={`mailto:${email}`}
                        aria-label={t("team.email")}
                    >
                        <Mail size={14} strokeWidth={2} />
                        <span>{t("team.email")}</span>
                    </a>
                )}

                {website && (
                    <a
                        className="tg-chip tg-chip--link"
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Globe size={14} strokeWidth={2} />
                        <span>{t("team.web")}</span>
                    </a>
                )}
            </div>
        </div>
    );
}

export default function TeamGrid({ people }) {
    const { t } = useTranslation();
    const { props } = usePage();
    const apiStaff = props?.global?.staff ?? [];
    const list =
        Array.isArray(people) && people.length
            ? people
            : Array.isArray(apiStaff) && apiStaff.length
              ? apiStaff
              : demoTeam;

    let leadIdx = list.findIndex((p) =>
        norm(p.name || "").includes("sezai koc"),
    );
    if (leadIdx < 0) leadIdx = 0;
    const lead = list[leadIdx];
    const ordered = [lead, ...list.filter((_, i) => i !== leadIdx)].filter(
        Boolean,
    );

    return (
        <section className="tg-section tg-meshbg">
            <div className="tg-pattern" aria-hidden="true" />

            <React.Suspense fallback={null}>
                <div className="tt3-particles-layer" aria-hidden="true">
                    <Particles
                        className="tt3-particles"
                        particleCount={90}
                        particleSpread={8}
                        speed={0.035}
                        moveParticlesOnHover
                        particleHoverFactor={0.35}
                        alphaParticles
                        particleBaseSize={120}
                        sizeRandomness={0.6}
                        cameraDistance={18}
                        particleColors={["#19bf73", "#0ea567", "#8ee7c8"]}
                    />
                </div>
            </React.Suspense>

            <div className="tg-shell">
                <header className="tg-head">
                    <span className="eyebrow">werrapark</span>
                    <h2 className="tg-heading">{t("team.heading")}</h2>
                    <p className="tg-sub">{t("team.subtitle")}</p>
                </header>

                <div className="tg-grid">
                    {ordered.map((p, i) => {
                        const src =
                            p.image ||
                            p.avatar ||
                            "/images/avatar-placeholder.png";
                        return (
                            <article
                                className={`tg-card ${i === 0 ? "is-lead" : ""}`}
                                key={p.id || p.email || p.name || i}
                            >
                                <TeamMedia src={src} name={p.name} />
                                <CardInfo
                                    title={p.title}
                                    email={p.email}
                                    phone={p.phone || p.tel || p.mobile}
                                    website={p.website || p.url}
                                />
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

import React from "react";
import { usePage } from "@inertiajs/react";
import { FaWhatsapp } from "react-icons/fa";
import "../../css/ui-widgets.css";

export default function WhatsAppWidget() {
    const { props } = usePage();

    const raw = props?.global?.widgets?.whatsapp;

    const wa = Array.isArray(raw?.data)
        ? raw.data[0]
        : Array.isArray(raw)
          ? raw[0]
          : raw;

    console.log("WA:", wa);

    if (!wa || wa.is_active !== true) return null;

    const phone = String(wa.phone_number || "").replace(/\D/g, "");
    if (!phone) return null;

    const message = wa.default_message || "";
    const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    const [open, setOpen] = React.useState(wa.open_by_default === true);

    const positionClass =
        wa.button_position === "bottom-left" ? "ui-wa--left" : "ui-wa--right";

    return (
        <aside className={`ui-wa ${positionClass}`}>
            {open && (
                <div className="ui-wa-panel">
                    <div
                        className="ui-wa-head"
                        style={{ backgroundColor: wa.button_color }}
                    >
                        {wa.name || "WhatsApp"}
                    </div>

                    <div className="ui-wa-body">
                        <p>{wa.welcome_text}</p>

                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ui-wa-link"
                            style={{
                                backgroundColor: wa.button_color,
                                color: wa.button_text_color,
                            }}
                        >
                            Chat starten
                        </a>
                    </div>
                </div>
            )}

            <button
                className="ui-wa-btn"
                onClick={() => setOpen((v) => !v)}
                style={{
                    backgroundColor: wa.button_color,
                    color: wa.button_text_color,
                }}
            >
                <FaWhatsapp />
            </button>
        </aside>
    );
}

import React from "react";
import { Head, usePage, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

export default function ArtisanIndex({
    locale,
    commands,
    grouped,
    categories,
    apiAvailable,
}) {
    const { props } = usePage();
    const flashResult = props?.flash?.commandResult;
    const [running, setRunning] = React.useState(null);

    const runCommand = (cmd) => {
        if (cmd.disabled) return;
        setRunning(cmd.command);
        router.post(
            `/${locale}/artisan/run`,
            { command: cmd.command },
            {
                preserveScroll: true,
                onFinish: () => setRunning(null),
            },
        );
    };

    const groups =
        grouped && Object.keys(grouped).length
            ? grouped
            : { default: commands };

    return (
        <AppLayout currentRoute="artisan">
            <Head title="Artisan Commands – Hotel Amadeus" />

            <div
                style={{
                    padding: "2rem 1.5rem",
                    maxWidth: 960,
                    margin: "0 auto",
                }}
            >
                <h1 style={{ marginBottom: "0.5rem", fontSize: "1.75rem" }}>
                    Artisan Commands
                </h1>
                <p style={{ color: "#666", marginBottom: "1.5rem" }}>
                    API üzerinden çalıştırılabilir Laravel komutları
                </p>

                {!apiAvailable && (
                    <div
                        style={{
                            padding: "1rem",
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: 8,
                            marginBottom: "1.5rem",
                        }}
                    >
                        API erişilemiyor. Komutlar yüklenemedi.
                    </div>
                )}

                {flashResult && (
                    <div
                        style={{
                            padding: "1rem",
                            background: flashResult.success
                                ? "#f0fdf4"
                                : "#fef2f2",
                            border: `1px solid ${flashResult.success ? "#bbf7d0" : "#fecaca"}`,
                            borderRadius: 8,
                            marginBottom: "1.5rem",
                        }}
                    >
                        <strong>
                            {flashResult.success ? "Başarılı" : "Hata"}:
                        </strong>{" "}
                        {flashResult.message}
                        {flashResult.output && (
                            <pre
                                style={{
                                    marginTop: "0.5rem",
                                    fontSize: "0.85rem",
                                    overflow: "auto",
                                    maxHeight: 200,
                                }}
                            >
                                {flashResult.output}
                            </pre>
                        )}
                    </div>
                )}

                {Object.entries(groups).map(([groupKey, items]) => (
                    <section
                        key={groupKey}
                        style={{
                            marginBottom: "2rem",
                            padding: "1rem",
                            background: "#f8fafc",
                            borderRadius: 8,
                            border: "1px solid #e2e8f0",
                        }}
                    >
                        <h2
                            style={{
                                marginBottom: "1rem",
                                fontSize: "1.1rem",
                                color: "#334155",
                            }}
                        >
                            {categories?.[groupKey] ?? groupKey}
                        </h2>
                        <div
                            style={{
                                display: "grid",
                                gap: "0.75rem",
                                gridTemplateColumns:
                                    "repeat(auto-fill, minmax(280px, 1fr))",
                            }}
                        >
                            {(items || []).map((cmd) => (
                                <div
                                    key={cmd.command}
                                    style={{
                                        padding: "1rem",
                                        background: "#fff",
                                        borderRadius: 6,
                                        border: "1px solid #e2e8f0",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.5rem",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: 4,
                                                background: cmd.disabled
                                                    ? "#cbd5e1"
                                                    : "#0f766e",
                                                flexShrink: 0,
                                            }}
                                            aria-hidden
                                        />
                                        <strong style={{ fontSize: "0.95rem" }}>
                                            {cmd.name ?? cmd.command}
                                        </strong>
                                    </div>
                                    {cmd.description && (
                                        <p
                                            style={{
                                                fontSize: "0.85rem",
                                                color: "#64748b",
                                                margin: 0,
                                            }}
                                        >
                                            {cmd.description}
                                        </p>
                                    )}
                                    <code
                                        style={{
                                            fontSize: "0.8rem",
                                            background: "#f1f5f9",
                                            padding: "0.2rem 0.4rem",
                                            borderRadius: 4,
                                        }}
                                    >
                                        {cmd.command}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => runCommand(cmd)}
                                        disabled={
                                            cmd.disabled ||
                                            running === cmd.command
                                        }
                                        style={{
                                            marginTop: "auto",
                                            padding: "0.5rem 1rem",
                                            background: cmd.disabled
                                                ? "#cbd5e1"
                                                : "#0f766e",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 6,
                                            cursor: cmd.disabled
                                                ? "not-allowed"
                                                : "pointer",
                                            fontSize: "0.9rem",
                                        }}
                                    >
                                        {running === cmd.command
                                            ? "Çalışıyor..."
                                            : cmd.disabled
                                              ? "Devre dışı"
                                              : "Çalıştır"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </AppLayout>
    );
}

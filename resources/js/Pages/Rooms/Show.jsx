import React from "react";
import { usePage } from "@inertiajs/react";
import {
    Bath,
    BedDouble,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    Hash,
    Hotel,
    MapPin,
    Maximize,
    ScrollText,
    Sparkles,
    Star,
    UtensilsCrossed,
    Users,
} from "lucide-react";
import AppLayout from "@/Layouts/AppLayout";
import SeoHead from "@/Components/SeoHead";
import { useTranslation } from "@/i18n";
import RoomCalendar from "@/Components/RoomCalendar";
import "@/../css/room-detail.css";

function pickTranslation(translations, locale) {
    if (!Array.isArray(translations)) return null;
    return (
        translations.find(
            (item) =>
                String(
                    item?.language_code ?? item?.locale ?? "",
                ).toLowerCase() === String(locale).toLowerCase(),
        ) ??
        translations[0] ??
        null
    );
}

function toArray(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
}

function uniqueItems(items) {
    const seen = new Set();

    return items.filter((item) => {
        const key = String(item ?? "")
            .trim()
            .toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function normalizeImageItem(img) {
    if (!img) return null;

    if (typeof img === "string") {
        return { url: img, alt: "" };
    }

    const url =
        img?.url ??
        img?.path ??
        img?.src ??
        img?.image ??
        img?.media?.url ??
        img?.data?.attributes?.url ??
        null;

    if (!url) return null;

    return {
        url,
        alt: img?.alt ?? img?.title ?? "",
    };
}

function parseDescription(description = "") {
    const lines = String(description)
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    const intro = [];
    const sections = [];
    let current = null;

    const pushCurrent = () => {
        if (!current || !current.items.length) return;
        sections.push({
            title: current.title,
            items: uniqueItems(current.items),
        });
    };

    lines.forEach((line) => {
        const isHeading = /:\s*$/.test(line) && line.length <= 80;

        if (isHeading) {
            pushCurrent();
            current = {
                title: line.replace(/:\s*$/, ""),
                items: [],
            };
            return;
        }

        if (current) {
            current.items.push(line);
            return;
        }

        intro.push(line);
    });

    pushCurrent();

    return {
        intro: uniqueItems(intro),
        sections,
    };
}

function sectionIcon(title = "") {
    const value = String(title).toLowerCase();

    if (
        value.includes("küche") ||
        value.includes("kitchen") ||
        value.includes("mutfak")
    ) {
        return UtensilsCrossed;
    }

    if (
        value.includes("bad") ||
        value.includes("bath") ||
        value.includes("banyo")
    ) {
        return Bath;
    }

    if (
        value.includes("aussicht") ||
        value.includes("view") ||
        value.includes("manzara")
    ) {
        return Eye;
    }

    return CheckCircle2;
}

function formatMoney(value, locale) {
    if (value == null || Number.isNaN(Number(value))) return null;

    try {
        return new Intl.NumberFormat(
            locale === "de" ? "de-DE" : locale === "tr" ? "tr-TR" : "en-US",
            {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
            },
        ).format(Number(value));
    } catch {
        return `${value} EUR`;
    }
}

function formatDateLabel(value, locale) {
    const parts = parseDateParts(value);
    if (!parts) return value || null;

    try {
        return new Intl.DateTimeFormat(
            locale === "de" ? "de-DE" : locale === "tr" ? "tr-TR" : "en-US",
            { day: "2-digit", month: "short", year: "numeric" },
        ).format(createUtcDate(parts.year, parts.month, parts.day));
    } catch {
        return value;
    }
}

function parseDateParts(value) {
    if (value == null) return null;

    if (typeof value === "number" && Number.isFinite(value)) {
        const d = new Date(value);
        if (!Number.isNaN(d.getTime())) {
            return {
                year: d.getUTCFullYear(),
                month: d.getUTCMonth() + 1,
                day: d.getUTCDate(),
            };
        }
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return {
            year: value.getUTCFullYear(),
            month: value.getUTCMonth() + 1,
            day: value.getUTCDate(),
        };
    }

    const raw = String(value).trim();
    if (!raw) return null;

    const isoDay = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDay) {
        const year = Number(isoDay[1]);
        const month = Number(isoDay[2]);
        const day = Number(isoDay[3]);
        if (!year || !month || !day) return null;
        return { year, month, day };
    }

    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) {
        const d = new Date(parsed);
        return {
            year: d.getUTCFullYear(),
            month: d.getUTCMonth() + 1,
            day: d.getUTCDate(),
        };
    }

    return null;
}

function createUtcDate(year, month, day) {
    return new Date(Date.UTC(year, month - 1, day));
}

function formatMonthLabel(year, month, locale) {
    const date = createUtcDate(year, month, 1);

    try {
        return new Intl.DateTimeFormat(
            locale === "de" ? "de-DE" : locale === "tr" ? "tr-TR" : "en-US",
            { month: "long", year: "numeric" },
        ).format(date);
    } catch {
        return `${month}/${year}`;
    }
}

function weekdayLabels(locale) {
    const base = createUtcDate(2026, 3, 2);

    return Array.from({ length: 7 }, (_, index) => {
        const current = new Date(base);
        current.setUTCDate(base.getUTCDate() + index);

        try {
            return new Intl.DateTimeFormat(
                locale === "de" ? "de-DE" : locale === "tr" ? "tr-TR" : "en-US",
                { weekday: "short" },
            ).format(current);
        } catch {
            return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index];
        }
    });
}

function buildPriceCalendar(items, locale) {
    if (!Array.isArray(items) || items.length === 0) return [];

    const monthMap = new Map();

    items.forEach((item) => {
        const parts = parseDateParts(item?.date);
        if (!parts) return;

        const key = `${parts.year}-${String(parts.month).padStart(2, "0")}`;
        if (!monthMap.has(key)) {
            monthMap.set(key, {
                key,
                year: parts.year,
                month: parts.month,
                label: formatMonthLabel(parts.year, parts.month, locale),
                items: [],
            });
        }

        monthMap.get(key).items.push({
            ...item,
            ...parts,
        });
    });

    return Array.from(monthMap.values())
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((month) => {
            const firstDay = createUtcDate(month.year, month.month, 1);
            const firstWeekday = (firstDay.getUTCDay() + 6) % 7;
            const daysInMonth = new Date(
                Date.UTC(month.year, month.month, 0),
            ).getUTCDate();
            const itemByDay = new Map(
                month.items.map((item) => [item.day, item]),
            );
            const days = [];

            for (let i = 0; i < firstWeekday; i += 1) {
                days.push({
                    type: "empty",
                    key: `empty-start-${month.key}-${i}`,
                });
            }

            for (let day = 1; day <= daysInMonth; day += 1) {
                const item = itemByDay.get(day) ?? null;
                days.push({
                    type: item ? "price" : "plain",
                    key: `${month.key}-${day}`,
                    day,
                    item,
                });
            }

            while (days.length % 7 !== 0) {
                days.push({
                    type: "empty",
                    key: `empty-end-${month.key}-${days.length}`,
                });
            }

            const pricedItems = month.items.filter(
                (item) => item.price != null && !item.closed,
            );
            const minPrice =
                pricedItems.length > 0
                    ? Math.min(...pricedItems.map((item) => Number(item.price)))
                    : null;

            return {
                ...month,
                days,
                minPrice,
            };
        });
}

function getFirstSelectableDay(months) {
    for (const month of months) {
        const match = month.days.find(
            (cell) => cell.type === "price" && cell.item && !cell.item.closed,
        );

        if (match?.item?.date) {
            return match.item.date;
        }
    }

    for (const month of months) {
        const match = month.days.find(
            (cell) => cell.type === "price" && cell.item,
        );

        if (match?.item?.date) {
            return match.item.date;
        }
    }

    return null;
}

function getCheapestSelectableDay(months) {
    let cheapest = null;

    months.forEach((month) => {
        month.days.forEach((cell) => {
            if (cell.type !== "price" || !cell.item || cell.item.closed) return;
            if (
                cell.item.price == null ||
                Number.isNaN(Number(cell.item.price))
            )
                return;

            if (!cheapest || Number(cell.item.price) < Number(cheapest.price)) {
                cheapest = cell.item;
            }
        });
    });

    return cheapest?.date ?? null;
}

function normalizeRoom(apiRoom, locale) {
    if (!apiRoom || typeof apiRoom !== "object" || !apiRoom.id) return null;

    const translation = pickTranslation(apiRoom.translations, locale);
    const parsedDescription = parseDescription(
        translation?.description ?? apiRoom.description ?? "",
    );
    const images = uniqueItems(
        [
            normalizeImageItem(apiRoom.image),
            ...toArray(apiRoom.images).map(normalizeImageItem),
        ]
            .filter(Boolean)
            .map((img) => JSON.stringify(img)),
    ).map((item) => JSON.parse(item));
    const heroImg = apiRoom.image || images[0]?.url || "/images/template2.png";
    const features = Array.isArray(apiRoom.features)
        ? apiRoom.features
              .filter((item) => (item?.status ?? "active") === "active")
              .map((item) => ({
                  id: item?.id ?? item?.name,
                  name: item?.name ?? "",
                  icon: item?.icon ?? null,
              }))
        : [];
    const boardTypes = Array.isArray(apiRoom.board_types)
        ? apiRoom.board_types
              .filter((item) => item?.is_active !== false)
              .map((item) => ({
                  id: item?.id ?? item?.code ?? item?.name,
                  name: item?.name ?? "",
                  code: item?.code ?? "",
                  description: item?.description ?? "",
              }))
        : [];
    const roomPrices = Array.isArray(apiRoom.room_prices)
        ? apiRoom.room_prices.map((item) => ({
              id: item?.id ?? null,
              date: item?.date ?? null,
              price: item?.price ?? null,
              capacity: item?.capacity ?? null,
              closed: Boolean(item?.closed),
              notes: item?.notes ?? "",
              discountRate: item?.discount_rate ?? null,
              childDiscount06: item?.child_discount_0_6 ?? null,
              childDiscount712: item?.child_discount_7_12 ?? null,
              childDiscount1318: item?.child_discount_13_18 ?? null,
          }))
        : [];
    const boardPrices = Array.isArray(apiRoom.board_prices)
        ? apiRoom.board_prices.map((item) => ({
              id: item?.id ?? item?.board_type_id ?? null,
              name: item?.name ?? item?.board_type_name ?? "",
              code: item?.code ?? item?.board_type_code ?? "",
              price: item?.price ?? null,
          }))
        : [];
    const sectionAmenities = parsedDescription.sections.flatMap(
        (section) => section.items,
    );
    const amenityItems = uniqueItems([
        ...features.map((item) => item?.name).filter(Boolean),
        ...sectionAmenities,
    ]);
    const hotel =
        apiRoom.hotel && typeof apiRoom.hotel === "object"
            ? apiRoom.hotel
            : null;

    return {
        id: apiRoom.id,
        slug: apiRoom.slug ?? String(apiRoom.id),
        name: translation?.name ?? apiRoom.name ?? "",
        description: translation?.description ?? apiRoom.description ?? "",
        roomType: apiRoom.room_type ?? "",
        roomNumber: apiRoom.room_number ?? "",
        capacity: apiRoom.capacity ?? null,
        beds: apiRoom.beds ?? null,
        size: apiRoom.size ?? null,
        viewType: apiRoom.view_type ?? "",
        status: apiRoom.status ?? "",
        hotel,
        heroImage: heroImg,
        gallery: images.length ? images : [{ url: heroImg, alt: "" }],
        features,
        boardTypes,
        boardPrices,
        roomPrices,
        introLines: parsedDescription.intro,
        descriptionSections: parsedDescription.sections,
        amenities: amenityItems,
    };
}

export default function RoomShow() {
    const { props } = usePage();
    const { t, locale } = useTranslation();

    const data = React.useMemo(
        () => normalizeRoom(props?.room, locale),
        [props?.room, locale],
    );

    const images = data?.gallery?.length
        ? data.gallery
        : [{ url: "/images/template2.png", alt: "" }];
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [paused, setPaused] = React.useState(false);
    const activeImage = images[activeIndex] ?? images[0];

    React.useEffect(() => {
        setActiveIndex(0);
    }, [data?.id]);

    React.useEffect(() => {
        if (paused || images.length <= 1) return;
        const interval = window.setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % images.length);
        }, 4200);
        return () => window.clearInterval(interval);
    }, [images.length, paused, data?.id]);

    const goPrev = () =>
        setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    const goNext = () => setActiveIndex((prev) => (prev + 1) % images.length);

    const quickFacts = data
        ? [
              data.roomType
                  ? {
                        icon: <BedDouble size={16} />,
                        label: t("roomDetail.roomTypeLabel"),
                        value: data.roomType,
                    }
                  : null,
              data.capacity
                  ? {
                        icon: <Users size={16} />,
                        label: t("roomDetail.capacityLabel"),
                        value: t("roomDetail.capacityValue", {
                            count: data.capacity,
                        }),
                    }
                  : null,
              data.beds
                  ? {
                        icon: <BedDouble size={16} />,
                        label: t("roomDetail.bedsLabel"),
                        value: t("roomDetail.bedsValue", { count: data.beds }),
                    }
                  : null,
              data.size
                  ? {
                        icon: <Maximize size={16} />,
                        label: t("roomDetail.sizeLabel"),
                        value: `${data.size} m²`,
                    }
                  : null,
              data.viewType
                  ? {
                        icon: <Eye size={16} />,
                        label: t("roomDetail.viewLabel"),
                        value: data.viewType,
                    }
                  : null,
              data.roomNumber
                  ? {
                        icon: <Hash size={16} />,
                        label: t("roomDetail.roomNumberLabel"),
                        value: data.roomNumber,
                    }
                  : null,
          ].filter(Boolean)
        : [];

    const hotelFacts = data?.hotel
        ? [
              data.hotel?.name
                  ? {
                        icon: <Hotel size={16} />,
                        label: t("roomDetail.hotelLabel"),
                        value: data.hotel.name,
                    }
                  : null,
              data.hotel?.location
                  ? {
                        icon: <MapPin size={16} />,
                        label: t("roomDetail.locationLabel"),
                        value: data.hotel.location,
                    }
                  : null,
              data.hotel?.stars
                  ? {
                        icon: <Star size={16} />,
                        label: t("roomDetail.hotelStarsLabel"),
                        value: t("roomDetail.hotelStarsValue", {
                            count: data.hotel.stars,
                        }),
                    }
                  : null,
          ].filter(Boolean)
        : [];
    const boardPriceItems = data
        ? (data.boardPrices?.length
              ? data.boardPrices
              : data.boardTypes
          ).filter(Boolean)
        : [];
    const calendarMonths = React.useMemo(
        () => buildPriceCalendar(data?.roomPrices ?? [], locale),
        [data?.roomPrices, locale],
    );
    const weekdays = React.useMemo(() => weekdayLabels(locale), [locale]);
    const allCalendarItems = React.useMemo(
        () =>
            calendarMonths.flatMap((month, index) =>
                month.days
                    .filter((cell) => cell.type === "price" && cell.item)
                    .map((cell) => ({
                        ...cell.item,
                        monthIndex: index,
                        monthKey: month.key,
                        monthLabel: month.label,
                    })),
            ),
        [calendarMonths],
    );
    const [monthIndex, setMonthIndex] = React.useState(0);
    const [selectedDateKey, setSelectedDateKey] = React.useState(null);

    React.useEffect(() => {
        setMonthIndex(0);
        setSelectedDateKey(getFirstSelectableDay(calendarMonths));
    }, [data?.id, calendarMonths]);

    const currentCalendarMonth = calendarMonths[monthIndex] ?? null;
    const selectedItemIndex = React.useMemo(
        () =>
            allCalendarItems.findIndex((item) => item.date === selectedDateKey),
        [allCalendarItems, selectedDateKey],
    );
    const selectedCalendarItem =
        selectedItemIndex >= 0 ? allCalendarItems[selectedItemIndex] : null;
    const prevCalendarItem =
        selectedItemIndex > 0 ? allCalendarItems[selectedItemIndex - 1] : null;
    const nextCalendarItem =
        selectedItemIndex >= 0 &&
        selectedItemIndex < allCalendarItems.length - 1
            ? allCalendarItems[selectedItemIndex + 1]
            : null;
    const cheapestDateKey = React.useMemo(
        () => getCheapestSelectableDay(calendarMonths),
        [calendarMonths],
    );

    const selectCalendarDate = React.useCallback(
        (date) => {
            if (!date) return;

            const matchIndex = allCalendarItems.findIndex(
                (item) => item.date === date,
            );
            if (matchIndex < 0) return;

            setSelectedDateKey(date);
            setMonthIndex(allCalendarItems[matchIndex].monthIndex);
        },
        [allCalendarItems],
    );

    if (!data) {
        return (
            <AppLayout currentRoute="rooms">
                <SeoHead title="Room Not Found" noIndex />
                <section
                    className="rux-wrap"
                    style={{ textAlign: "center", padding: "120px 20px" }}
                >
                    <h1>Room not found</h1>
                    <a
                        href={locale === "de" ? "/" : `/${locale}`}
                        className="rux-btn rux-btn--ghost"
                        style={{ marginTop: 20 }}
                    >
                        {t("roomDetail.homeBtn")}
                    </a>
                </section>
            </AppLayout>
        );
    }

    return (
        <AppLayout currentRoute="rooms">
            <SeoHead
                title={t("roomDetail.pageTitle", { name: data.name })}
                description={data.description}
                image={data.heroImage}
            />

            <section className="rux-wrap" aria-labelledby="rux-title">
                <div className="rux-grid">
                    <article className="rux-stage-card">
                        <figure
                            className="rux-stage"
                            onMouseEnter={() => setPaused(true)}
                            onMouseLeave={() => setPaused(false)}
                        >
                            <img
                                src={activeImage.url}
                                alt={activeImage.alt || data.name}
                            />
                            <div className="rux-overlay" />

                            {images.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        className="rux-arrow rux-arrow--left"
                                        onClick={goPrev}
                                        aria-label={t("roomDetail.prevImage")}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        className="rux-arrow rux-arrow--right"
                                        onClick={goNext}
                                        aria-label={t("roomDetail.nextImage")}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </>
                            )}
                        </figure>

                        <div className="rux-thumbs">
                            {images.map((image, index) => (
                                <button
                                    key={`${image.url}-${index}`}
                                    type="button"
                                    className={`rux-thumb ${index === activeIndex ? "is-active" : ""}`}
                                    onClick={() => setActiveIndex(index)}
                                    aria-label={t("roomDetail.imageN", {
                                        n: index + 1,
                                    })}
                                >
                                    <img
                                        src={image.url}
                                        alt={image.alt || ""}
                                        aria-hidden="true"
                                    />
                                </button>
                            ))}
                        </div>
                    </article>

                    <aside className="rux-aside">
                        <p className="rux-eyebrow">{t("roomDetail.eyebrow")}</p>
                        <h1 id="rux-title" className="rux-title">
                            {data.name}
                        </h1>

                        {data.viewType ? (
                            <p className="rux-loc">
                                <MapPin size={15} />
                                <span>{data.viewType}</span>
                            </p>
                        ) : null}

                        {hotelFacts.length > 0 && (
                            <article className="rux-hotel-card">
                                <div className="rux-hotel-card__head">
                                    <Hotel size={16} />
                                    <h2>{t("roomDetail.hotelInfoTitle")}</h2>
                                </div>
                                <div className="rux-hotel-card__body">
                                    {hotelFacts.map((fact, i) => (
                                        <article
                                            key={i}
                                            className="rux-hotel-card__item"
                                        >
                                            <div className="rux-hotel-card__label">
                                                {fact.icon}
                                                <span>{fact.label}</span>
                                            </div>
                                            <strong>{fact.value}</strong>
                                        </article>
                                    ))}
                                </div>
                            </article>
                        )}

                        <RoomCalendar
                            t={t}
                            locale={locale}
                            calendarMonths={calendarMonths}
                            monthIndex={monthIndex}
                            setMonthIndex={setMonthIndex}
                            currentCalendarMonth={currentCalendarMonth}
                            weekdays={weekdays}
                            selectedDateKey={selectedDateKey}
                            selectCalendarDate={selectCalendarDate}
                            selectedCalendarItem={selectedCalendarItem}
                            prevCalendarItem={prevCalendarItem}
                            nextCalendarItem={nextCalendarItem}
                            cheapestDateKey={cheapestDateKey}
                            formatMoney={formatMoney}
                            formatDateLabel={formatDateLabel}
                            getFirstSelectableDay={getFirstSelectableDay}
                        />

                        {data.introLines.length > 0 ? (
                            <div className="rux-intro">
                                {data.introLines.map((line, index) => (
                                    <p key={index}>{line}</p>
                                ))}
                            </div>
                        ) : (
                            <p className="rux-intro">{data.description}</p>
                        )}

                        {quickFacts.length > 0 && (
                            <div className="rux-facts rux-facts--grid">
                                {quickFacts.map((fact, i) => (
                                    <article key={i} className="rux-fact">
                                        <div className="rux-fact__label">
                                            {fact.icon}
                                            <span>{fact.label}</span>
                                        </div>
                                        <strong>{fact.value}</strong>
                                    </article>
                                ))}
                            </div>
                        )}

                        <article className="rux-cta">
                            <p className="rux-kicker">
                                {t("roomDetail.idealFor")}
                            </p>
                            <h2>
                                {[data.roomType, data.viewType]
                                    .filter(Boolean)
                                    .join(" · ") || data.name}
                            </h2>
                            <p>{t("roomDetail.bookingText")}</p>
                            <div className="rux-actions">
                                <a
                                    href={`/${locale}/kontakt`}
                                    className="rux-btn rux-btn--primary"
                                >
                                    {t("roomDetail.requestBtn")}
                                </a>
                                <a
                                    href={locale === "de" ? "/" : `/${locale}`}
                                    className="rux-btn rux-btn--ghost"
                                >
                                    {t("roomDetail.homeBtn")}
                                </a>
                            </div>
                        </article>
                    </aside>
                </div>

                <div className="rux-bottom">
                    {data.descriptionSections.length > 0 && (
                        <article className="rux-panel rux-panel--sections">
                            <div className="rux-panel-head">
                                <ScrollText size={17} />
                                <h3>{t("roomDetail.detailsTitle")}</h3>
                            </div>
                            <div className="rux-section-grid">
                                {data.descriptionSections.map(
                                    (section, index) => {
                                        const Icon = sectionIcon(section.title);

                                        return (
                                            <section
                                                className="rux-subpanel"
                                                key={`${section.title}-${index}`}
                                            >
                                                <div className="rux-subpanel__head">
                                                    <Icon size={16} />
                                                    <h4>{section.title}</h4>
                                                </div>
                                                <ul className="rux-list">
                                                    {section.items.map(
                                                        (item, itemIndex) => (
                                                            <li
                                                                key={`${item}-${itemIndex}`}
                                                            >
                                                                <CheckCircle2
                                                                    size={16}
                                                                />
                                                                <span>
                                                                    {item}
                                                                </span>
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </section>
                                        );
                                    },
                                )}
                            </div>
                        </article>
                    )}

                    {boardPriceItems.length > 0 && (
                        <article className="rux-panel">
                            <div className="rux-panel-head">
                                <BedDouble size={17} />
                                <h3>{t("roomDetail.boardPriceTitle")}</h3>
                            </div>
                            <ul className="rux-list">
                                {boardPriceItems.map((item) => (
                                    <li
                                        key={
                                            item.id ??
                                            `${item.name}-${item.code}`
                                        }
                                    >
                                        <CheckCircle2 size={16} />
                                        <span>
                                            {[
                                                item.name,
                                                item.code,
                                                item.description,
                                                item.price != null
                                                    ? formatMoney(
                                                          item.price,
                                                          locale,
                                                      )
                                                    : null,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    )}

                    {data.features.length > 0 && (
                        <article className="rux-panel rux-panel--amenities">
                            <div className="rux-panel-head">
                                <Sparkles size={17} />
                                <h3>{t("roomDetail.amenities")}</h3>
                            </div>
                            <div className="rux-chip-grid">
                                {data.features.map((item) => (
                                    <span className="rux-chip" key={item.id}>
                                        {item.name}
                                    </span>
                                ))}
                            </div>
                        </article>
                    )}

                    {data.amenities.length > 0 &&
                        data.features.length === 0 && (
                            <article className="rux-panel rux-panel--amenities">
                                <div className="rux-panel-head">
                                    <Sparkles size={17} />
                                    <h3>{t("roomDetail.amenities")}</h3>
                                </div>
                                <div className="rux-chip-grid">
                                    {data.amenities.map((item) => (
                                        <span className="rux-chip" key={item}>
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </article>
                        )}
                </div>
            </section>
        </AppLayout>
    );
}

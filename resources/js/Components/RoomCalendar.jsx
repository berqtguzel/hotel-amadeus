import React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import "../../css/room-calendar.css";
import { useTranslation } from "@/i18n";

export default function RoomCalendar({
    locale,
    calendarMonths,
    monthIndex,
    setMonthIndex,
    currentCalendarMonth,
    selectedDateKey,
    selectCalendarDate,
    selectedCalendarItem,
    prevCalendarItem,
    nextCalendarItem,
    cheapestDateKey,
    formatMoney,
    formatDateLabel,
    getFirstSelectableDay,
}) {
    const { t } = useTranslation();

    /* ✅ WEEKDAYS SAFE */
    const weekdaysRaw = t("weekdaysShort");
    const weekdays = Array.isArray(weekdaysRaw)
        ? weekdaysRaw
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    if (!currentCalendarMonth) {
        return (
            <article className="rux-calendar-panel">
                <header className="rux-calendar-panel__head">
                    <div className="rux-calendar-panel__title">
                        <CalendarDays size={16} />
                        <h1>{t("roomDetail.dailyPriceTitle")}</h1>
                    </div>
                </header>

                <div className="rux-calendar-month">
                    <header className="rux-calendar-month__head">
                        <h4>{t("roomDetail.calendarPendingTitle")}</h4>
                    </header>

                    <div className="rux-calendar-weekdays">
                        {weekdays.map((day, i) => (
                            <span key={i}>{day}</span>
                        ))}
                    </div>

                    <div className="rux-calendar-grid">
                        {Array.from({ length: 35 }).map((_, index) => (
                            <div
                                key={`pending-${index}`}
                                className="rux-calendar-cell is-empty"
                            />
                        ))}
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className="rux-calendar-panel">
            {/* HEADER */}
            <header className="rux-calendar-panel__head">
                <div className="rux-calendar-panel__title">
                    <CalendarDays size={16} />
                    <h1>{t("roomDetail.dailyPriceTitle")}</h1>
                </div>

                {calendarMonths.length > 1 && (
                    <div className="rux-calendar-nav">
                        <button
                            type="button"
                            onClick={() =>
                                setMonthIndex((prev) => Math.max(0, prev - 1))
                            }
                            disabled={monthIndex === 0}
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setMonthIndex((prev) =>
                                    Math.min(
                                        calendarMonths.length - 1,
                                        prev + 1,
                                    ),
                                )
                            }
                            disabled={monthIndex === calendarMonths.length - 1}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </header>

            {/* MONTH */}
            <div className="rux-calendar-month">
                <header className="rux-calendar-month__head">
                    <h4>{currentCalendarMonth.label}</h4>
                </header>

                {/* WEEKDAYS */}
                <div className="rux-calendar-weekdays">
                    {weekdays.map((day, i) => (
                        <span key={i}>{day}</span>
                    ))}
                </div>

                {/* GRID */}
                <div className="rux-calendar-grid">
                    {currentCalendarMonth.days.map((cell) => {
                        if (cell.type === "empty") {
                            return (
                                <div
                                    key={cell.key}
                                    className="rux-calendar-cell is-empty"
                                />
                            );
                        }

                        if (cell.type === "plain") {
                            return (
                                <div
                                    key={cell.key}
                                    className="rux-calendar-cell"
                                >
                                    <span className="rux-day">{cell.day}</span>
                                </div>
                            );
                        }

                        const item = cell.item;

                        return (
                            <button
                                key={cell.key}
                                type="button"
                                className={`rux-calendar-cell is-priced ${
                                    selectedDateKey === item?.date
                                        ? "is-selected"
                                        : ""
                                } ${item?.closed ? "is-closed" : ""}`}
                                onClick={() =>
                                    !item?.closed &&
                                    selectCalendarDate(item?.date)
                                }
                                disabled={item?.closed}
                            >
                                {/* DAY */}
                                <span className="rux-day">{cell.day}</span>

                                {/* PRICE */}
                                {item?.price && !item.closed && (
                                    <span className="rux-price">
                                        {formatMoney(item.price, locale)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* DETAIL */}
            {selectedCalendarItem && (
                <div className="rux-calendar-detail">
                    <button
                        type="button"
                        className="rux-detail-nav"
                        onClick={() =>
                            selectCalendarDate(prevCalendarItem?.date)
                        }
                        disabled={!prevCalendarItem}
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="rux-calendar-detail__center">
                        <span className="rux-detail-date">
                            {formatDateLabel(selectedCalendarItem.date, locale)}
                        </span>

                        <span className="rux-detail-price">
                            {formatMoney(selectedCalendarItem.price, locale)}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="rux-detail-nav"
                        onClick={() =>
                            selectCalendarDate(nextCalendarItem?.date)
                        }
                        disabled={!nextCalendarItem}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </article>
    );
}

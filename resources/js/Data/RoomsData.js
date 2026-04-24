const ROOMS_DATA = {
    heubach: {
        id: "heubach",
        hotelName: "Hotel Heubacher Höhe",
        location: "Masserberg • OT Heubach",
        heroImage: "/images/template2.png",
        // Buradaki görselleri doğrudan değiştirerek galeriyi özelleştirebilirsin.
        gallery: [
            "/images/template2.png",
            "/images/template1.webp",
            "/images/blockhaus.jpeg",
        ],
        intro: "Stilvolle Zimmer, viel Natur und kurze Wege zu den Highlights im Thüringer Wald. Ideal für Familien, Paare und aktive Gäste.",
        atmosphere:
            "Alpine Ruhe, funktionales Design und kurze Wege zwischen Zimmer, Gastronomie und Aktivbereichen.",
        roomTypes: [
            "13 Einzelzimmer • ca. 16 qm",
            "13 Standard Doppelzimmer • 16-20 qm",
            "32 Comfort Doppelzimmer • 18-20 qm (2+1)",
            "20 Zweiraum-Studios • 28-30 qm",
            "15 Familienzimmer • 40 qm (2 Schlafzimmer)",
        ],
        amenities: [
            "WLAN inklusive",
            "Frühstück / Halbpension möglich",
            "Teilweise Balkon oder Weitblick",
            "Nähe zu Wander- und Wintersportwegen",
            "Familienfreundliche Bereiche",
            "Parkmöglichkeiten",
        ],
        goodFor: "Aktive Gäste, Naturfreunde und Familien",
        quickFacts: [
            { label: "Zimmerkategorien", value: "5" },
            { label: "Großtes Zimmer", value: "40 qm" },
            { label: "Geeignet für", value: "Familien & Aktive" },
        ],
    },
    frankenblick: {
        id: "frankenblick",
        hotelName: "Hotel Frankenblick",
        location: "Masserberg • OT Schnett",
        heroImage: "/images/template2.png",
        gallery: [
            "/images/template2.png",
            "/images/template1.webp",
            "/images/blockhaus.jpeg",
        ],
        intro: "Komfortable Zimmer in ruhiger Lage mit weitem Blick ins Grüne. Perfekt für erholsame Tage und aktive Ausflüge.",
        atmosphere:
            "Panorama, natürliche Materialien und ruhige Farbwelten für entschleunigte Urlaubstage.",
        roomTypes: [
            "12 Einzelzimmer • ca. 16 qm",
            "44 Doppelzimmer • 18-20 qm",
            "20 Zweiraum-Studios • 28-30 qm",
        ],
        amenities: [
            "WLAN inklusive",
            "Ruhige Lage mit Panorama",
            "Restaurant mit regionaler Küche",
            "Direkter Zugang zu Wanderwegen",
            "Freundlicher Service vor Ort",
        ],
        goodFor: "Paare, Ruhesuchende und Natururlaub",
        quickFacts: [
            { label: "Zimmerkategorien", value: "3" },
            { label: "Großtes Zimmer", value: "30 qm" },
            { label: "Geeignet für", value: "Paare & Entspannung" },
        ],
    },
    sommerberg: {
        id: "sommerberg",
        hotelName: "Hotel Sommerberg",
        location: "Masserberg • OT Fehrenbach",
        heroImage: "/images/template2.png",
        gallery: [
            "/images/template2.png",
            "/images/template1.webp",
            "/images/blockhaus.jpeg",
        ],
        intro: "Viel Platz, flexible Zimmeroptionen und eine entspannte Atmosphäre - ideal für Familien und längere Aufenthalte.",
        atmosphere:
            "Großzügige Zimmerplanung, klare Linien und ein familienfreundliches Gesamtkonzept mit viel Freiraum.",
        roomTypes: [
            "2 Einzelzimmer • ca. 15 qm",
            "60 Doppelzimmer • 15-20 qm",
            "9 Familienzimmer • ca. 26 qm",
            "11 Studios • ca. 30 qm",
        ],
        amenities: [
            "WLAN inklusive",
            "Große Kapazitäten für Familien",
            "Gemütliche Aufenthaltsbereiche",
            "Gute Basis für Tagesausflüge",
            "Parkmöglichkeiten",
        ],
        goodFor: "Familien, Gruppen und Wochenendtrips",
        quickFacts: [
            { label: "Zimmerkategorien", value: "4" },
            { label: "Großtes Zimmer", value: "30 qm" },
            { label: "Geeignet für", value: "Familien & Gruppen" },
        ],
    },
};

export const ROOM_MAP = ROOMS_DATA;
export const ROOM_LIST = Object.values(ROOMS_DATA);

export default ROOMS_DATA;

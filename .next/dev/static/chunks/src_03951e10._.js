(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/athlete/WodSection.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WodSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function WodSection({ title, items }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-sm font-semibold",
                children: title
            }, void 0, false, {
                fileName: "[project]/src/components/athlete/WodSection.tsx",
                lineNumber: 10,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700",
                children: items.map((x, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: x
                    }, i, false, {
                        fileName: "[project]/src/components/athlete/WodSection.tsx",
                        lineNumber: 13,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/athlete/WodSection.tsx",
                lineNumber: 11,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/athlete/WodSection.tsx",
        lineNumber: 9,
        columnNumber: 7
    }, this);
}
_c = WodSection;
var _c;
__turbopack_context__.k.register(_c, "WodSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/mockWod.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mockWods",
    ()=>mockWods
]);
const mockWods = [
    {
        date: "2026-01-02",
        title: "Engine + Gimnásticos",
        intent: "Ritmo constante, respirable.",
        warmup: [
            "5' bike",
            "2 rounds: 10 air squats, 10 sit-ups"
        ],
        strength: [
            "E2MOM 10': 3 back squat @ RPE 7"
        ],
        metcon: [
            "AMRAP 12'",
            "10 T2B",
            "12 wall balls",
            "200m run"
        ],
        rx: [
            "WB 9/6 kg",
            "T2B completos"
        ],
        scaled: [
            "WB 6/4 kg",
            "Hanging knee raises"
        ]
    },
    {
        date: "2026-01-01",
        title: "Chipper largo",
        intent: "Trabajo mental, dividí bien.",
        warmup: [
            "400m run",
            "Movilidad hombros"
        ],
        metcon: [
            "For time:",
            "50 wall balls",
            "40 sit-ups",
            "30 push-ups",
            "20 box jumps",
            "10 pull-ups"
        ],
        rx: [
            "Box 60/50 cm"
        ],
        scaled: [
            "Box 50/40 cm"
        ]
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/(athlete)/athlete/wod/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WodPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$athlete$2f$WodSection$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/athlete/WodSection.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockWod$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mockWod.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function WodPage() {
    _s();
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("rx");
    const dateLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "WodPage.useMemo[dateLabel]": ()=>{
            const d = new Date(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockWod$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockWod"].date + "T00:00:00");
            return d.toLocaleDateString("es-ES", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit"
            });
        }
    }["WodPage.useMemo[dateLabel]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start justify-between gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-xl font-semibold",
                                children: "WOD"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                                lineNumber: 23,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 text-sm text-gray-500",
                                children: [
                                    dateLabel,
                                    " • ",
                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockWod$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockWod"].title
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                                lineNumber: 24,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                        lineNumber: 22,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl border border-gray-200 bg-white p-1 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setMode("rx"),
                                className: `rounded-lg px-3 py-1 ${mode === "rx" ? "bg-gray-900 text-white" : "text-gray-700"}`,
                                children: "RX"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                                lineNumber: 30,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setMode("scaled"),
                                className: `rounded-lg px-3 py-1 ${mode === "scaled" ? "bg-gray-900 text-white" : "text-gray-700"}`,
                                children: "Scaled"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                                lineNumber: 38,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-sm font-semibold",
                        children: "Intención"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                        lineNumber: 50,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-1 text-sm text-gray-700",
                        children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockWod$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockWod"].intent
                    }, void 0, false, {
                        fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                        lineNumber: 51,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                lineNumber: 49,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3 grid gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$athlete$2f$WodSection$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        title: "Warm-up",
                        items: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockWod$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockWod"].warmup
                    }, void 0, false, {
                        fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this),
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockWod$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockWod"].strength && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$athlete$2f$WodSection$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        title: "Strength",
                        items: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockWod$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockWod"].strength
                    }, void 0, false, {
                        fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                        lineNumber: 56,
                        columnNumber: 30
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$athlete$2f$WodSection$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        title: "Metcon",
                        items: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockWod$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockWod"].metcon
                    }, void 0, false, {
                        fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$athlete$2f$WodSection$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        title: mode === "rx" ? "Standards (RX)" : "Opciones (Scaled)",
                        items: mode === "rx" ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockWod$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockWod"].rx : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockWod$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockWod"].scaled
                    }, void 0, false, {
                        fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this),
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockWod$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockWod"].notes && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$athlete$2f$WodSection$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        title: "Notas del coach",
                        items: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockWod$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockWod"].notes
                    }, void 0, false, {
                        fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                        lineNumber: 62,
                        columnNumber: 27
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(athlete)/athlete/wod/page.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
}
_s(WodPage, "1rBO8bnulq31OdjLW0CfdiAQjA0=");
_c = WodPage;
var _c;
__turbopack_context__.k.register(_c, "WodPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_03951e10._.js.map
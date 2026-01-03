module.exports = [
"[project]/src/components/community/NotificationItem.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>NotificationItem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
function getActor(n) {
    return n?.actor?.name ?? n?.actorName ?? n?.user?.name ?? n?.userName ?? n?.name ?? n?.author ?? n?.from ?? n?.gymName ?? "Notificación";
}
function getAction(n) {
    return n?.action ?? n?.verb ?? n?.typeLabel ?? n?.message ?? n?.text ?? "envió una notificación";
}
function getTarget(n) {
    return n?.target ?? n?.object ?? n?.className ?? n?.wodTitle ?? n?.topic ?? "";
}
function safeDate(n) {
    const raw = n?.date ?? n?.createdAt ?? n?.at ?? n?.time ?? n?.timestamp;
    const d = raw ? new Date(raw) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
}
function formatDateES(d) {
    // "03 Ene 2026"
    const dd = String(d.getDate()).padStart(2, "0");
    const months = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic"
    ];
    const mm = months[d.getMonth()] ?? "";
    return `${dd} ${mm} ${d.getFullYear()}`;
}
function NotificationItem({ item }) {
    const d = safeDate(item);
    const actor = getActor(item);
    const action = getAction(item);
    const target = getTarget(item);
    const title = item?.title ?? item?.subject ?? item?.headline ?? ""; // opcional
    const subtitle = item?.description ?? item?.body ?? item?.subtitle ?? ""; // lo que sería “mensaje”
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "px-5 py-4",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-start justify-between gap-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "min-w-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-1 space-x-1 text-sm text-gray-500 dark:text-gray-400",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-medium text-gray-800 dark:text-white/90",
                                    children: actor
                                }, void 0, false, {
                                    fileName: "[project]/src/components/community/NotificationItem.tsx",
                                    lineNumber: 73,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: action
                                }, void 0, false, {
                                    fileName: "[project]/src/components/community/NotificationItem.tsx",
                                    lineNumber: 76,
                                    columnNumber: 13
                                }, this),
                                target ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-medium text-gray-800 dark:text-white/90",
                                    children: target
                                }, void 0, false, {
                                    fileName: "[project]/src/components/community/NotificationItem.tsx",
                                    lineNumber: 78,
                                    columnNumber: 15
                                }, this) : null
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/community/NotificationItem.tsx",
                            lineNumber: 72,
                            columnNumber: 11
                        }, this),
                        title ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-sm font-medium text-gray-800 dark:text-white/90",
                            children: title
                        }, void 0, false, {
                            fileName: "[project]/src/components/community/NotificationItem.tsx",
                            lineNumber: 85,
                            columnNumber: 13
                        }, this) : null,
                        subtitle ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-1 text-sm text-gray-700 dark:text-gray-200",
                            children: subtitle
                        }, void 0, false, {
                            fileName: "[project]/src/components/community/NotificationItem.tsx",
                            lineNumber: 91,
                            columnNumber: 13
                        }, this) : null
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/community/NotificationItem.tsx",
                    lineNumber: 71,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "shrink-0 text-xs text-gray-500 dark:text-gray-400",
                    children: formatDateES(d)
                }, void 0, false, {
                    fileName: "[project]/src/components/community/NotificationItem.tsx",
                    lineNumber: 97,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/community/NotificationItem.tsx",
            lineNumber: 70,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/community/NotificationItem.tsx",
        lineNumber: 69,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/community/NotificationsFeed.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>NotificationsFeed
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$community$2f$NotificationItem$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/community/NotificationItem.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$community$2f$notificationsMock$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/community/notificationsMock.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function safeDate(n) {
    const raw = n?.date ?? n?.createdAt ?? n?.at ?? n?.time ?? n?.timestamp;
    const d = raw ? new Date(raw) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
}
function getType(n) {
    return n?.type ?? n?.kind ?? n?.event ?? n?.category ?? "general";
}
// Reglas:
// - Comunidad muestra últimos 30 días
// - Athlete: NO ve reservas/cancelaciones/attendance. Ve gym_announcement + wod_comment + general
// - Coach/Admin: ven todo (por ahora mock)
function isVisible(scope, n) {
    const t = getType(n);
    if (scope === "athlete") {
        if (t === "reservation_created" || t === "reservation_cancelled" || t === "reservation" || t === "attendance" || t === "booking") {
            return false;
        }
        return true;
    }
    return true;
}
function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatDayHeader(d) {
    // Ej: 03 Ene 2026
    const dd = String(d.getDate()).padStart(2, "0");
    const months = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic"
    ];
    return `${dd} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
function NotificationsFeed({ scope }) {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const items = [
        ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$community$2f$notificationsMock$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationsMock"]
    ].map((n)=>({
            n,
            d: safeDate(n)
        })).filter(({ d, n })=>d >= cutoff && isVisible(scope, n)).sort((a, b)=>b.d.getTime() - a.d.getTime());
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border-b border-gray-200 px-5 py-4 dark:border-gray-800",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-semibold text-gray-800 dark:text-white/90",
                        children: "Comunidad"
                    }, void 0, false, {
                        fileName: "[project]/src/components/community/NotificationsFeed.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-1 text-sm text-gray-500 dark:text-gray-400",
                        children: "Últimos 30 días"
                    }, void 0, false, {
                        fileName: "[project]/src/components/community/NotificationsFeed.tsx",
                        lineNumber: 72,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/community/NotificationsFeed.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            items.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-5 py-6 text-sm text-gray-500 dark:text-gray-400",
                children: "No hay notificaciones en los últimos 30 días."
            }, void 0, false, {
                fileName: "[project]/src/components/community/NotificationsFeed.tsx",
                lineNumber: 78,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "divide-y divide-gray-200 dark:divide-gray-800",
                children: items.map(({ n, d }, idx)=>{
                    const prev = idx > 0 ? items[idx - 1].d : null;
                    const showHeader = !prev || !sameDay(d, prev);
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            showHeader ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-gray-50 px-5 py-2 text-xs font-medium text-gray-600 dark:bg-white/[0.02] dark:text-gray-300",
                                children: formatDayHeader(d)
                            }, void 0, false, {
                                fileName: "[project]/src/components/community/NotificationsFeed.tsx",
                                lineNumber: 90,
                                columnNumber: 19
                            }, this) : null,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$community$2f$NotificationItem$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                item: n
                            }, void 0, false, {
                                fileName: "[project]/src/components/community/NotificationsFeed.tsx",
                                lineNumber: 94,
                                columnNumber: 17
                            }, this)
                        ]
                    }, n.id ?? `${d.getTime()}-${idx}`, true, {
                        fileName: "[project]/src/components/community/NotificationsFeed.tsx",
                        lineNumber: 88,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/components/community/NotificationsFeed.tsx",
                lineNumber: 82,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/community/NotificationsFeed.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=src_components_community_7cfcb428._.js.map
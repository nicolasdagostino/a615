(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/athlete/AthleteStore.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AthleteProvider",
    ()=>AthleteProvider,
    "useAthlete",
    ()=>useAthlete
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const AthleteContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
const STORAGE_KEY = "a615.bookedIds";
function AthleteProvider({ children }) {
    _s();
    const [bookedIds, setBookedIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // cargar al iniciar
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AthleteProvider.useEffect": ()=>{
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setBookedIds(JSON.parse(raw));
        }
    }["AthleteProvider.useEffect"], []);
    // persistir cambios
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AthleteProvider.useEffect": ()=>{
            localStorage.setItem(STORAGE_KEY, JSON.stringify(bookedIds));
        }
    }["AthleteProvider.useEffect"], [
        bookedIds
    ]);
    const toggleBooking = (id)=>{
        setBookedIds((prev)=>prev.includes(id) ? prev.filter((x)=>x !== id) : [
                ...prev,
                id
            ]);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AthleteContext.Provider, {
        value: {
            bookedIds,
            toggleBooking
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/athlete/AthleteStore.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
}
_s(AthleteProvider, "ZxLHTRnJMGSmgqohaL/mnwOjeeg=");
_c = AthleteProvider;
function useAthlete() {
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AthleteContext);
    if (!ctx) throw new Error("useAthlete must be used inside AthleteProvider");
    return ctx;
}
_s1(useAthlete, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "AthleteProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/athlete/WodCommentsStore.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WodCommentsProvider",
    ()=>WodCommentsProvider,
    "useWodComments",
    ()=>useWodComments
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const Ctx = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
const STORAGE_KEY = "a615.wod.comments";
function WodCommentsProvider({ children }) {
    _s();
    const [commentsByDate, setCommentsByDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WodCommentsProvider.useEffect": ()=>{
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setCommentsByDate(JSON.parse(raw));
        }
    }["WodCommentsProvider.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WodCommentsProvider.useEffect": ()=>{
            localStorage.setItem(STORAGE_KEY, JSON.stringify(commentsByDate));
        }
    }["WodCommentsProvider.useEffect"], [
        commentsByDate
    ]);
    const addComment = (date, text)=>{
        const c = {
            id: crypto.randomUUID(),
            text,
            createdAt: Date.now()
        };
        setCommentsByDate((prev)=>({
                ...prev,
                [date]: [
                    ...prev[date] ?? [],
                    c
                ]
            }));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Ctx.Provider, {
        value: {
            commentsByDate,
            addComment
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/athlete/WodCommentsStore.tsx",
        lineNumber: 51,
        columnNumber: 5
    }, this);
}
_s(WodCommentsProvider, "iwC1bnazaOQDNMxNT9fZ4qLyL/Y=");
_c = WodCommentsProvider;
function useWodComments() {
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(Ctx);
    if (!ctx) throw new Error("useWodComments outside provider");
    return ctx;
}
_s1(useWodComments, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "WodCommentsProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_athlete_fe56c703._.js.map
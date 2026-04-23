const API_BASE_URL = "http://localhost:8000";

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 300000 } = options; 
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(`${API_BASE_URL}${resource}`, {
            ...options,
            signal: controller.signal  
        });
        clearTimeout(id);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Analysis failed");
        }
        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error("Request timed out. The analysis is taking too long.");
        }
        throw error;
    }
}

export const api = {
    analyzeDisappearing: (ticker, year) => 
        fetchWithTimeout("/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticker, year })
        }),

    analyzeEmerging: (ticker, year1, year2) => 
        fetchWithTimeout("/analyze/emerging", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticker, year1, year2 })
        }),

    analyzeMissingWithDrop: (ticker, year) => 
        fetchWithTimeout("/analyze/missing_with_drop_vs_others", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticker, year })
        }),

    analyzeGrowth: (ticker, year) => 
        fetchWithTimeout("/analyze/emerging_vs_others_growth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticker, year })
        }),

    runAll: async (ticker, year) => {
        const results = await Promise.allSettled([
            api.analyzeDisappearing(ticker, year),
            api.analyzeMissingWithDrop(ticker, year),
            api.analyzeGrowth(ticker, year) 
            // Note: analyzeEmerging needs year1/year2, 
            // so we omit it from this specific batch or pass defaults
        ]);

        return {
            disappearing: results[0].status === 'fulfilled' ? results[0].value : null,
            missing: results[1].status === 'fulfilled' ? results[1].value : null,
            growth: results[2].status === 'fulfilled' ? results[2].value : null,
        };
    },
        
    checkHealth: () => fetchWithTimeout("/health", { method: "GET" })
};

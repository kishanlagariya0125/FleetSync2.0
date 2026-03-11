import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem("fs_theme");
        if (saved) return saved;
        return "system";
    });

    const getEffective = (t) => {
        if (t === "system") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        return t;
    };

    const [effective, setEffective] = useState(() => getEffective(
        localStorage.getItem("fs_theme") || "system"
    ));

    useEffect(() => {
        localStorage.setItem("fs_theme", theme);
        const eff = getEffective(theme);
        setEffective(eff);
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(eff);
    }, [theme]);

    // Listen for system preference changes
    useEffect(() => {
        if (theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e) => {
            const eff = e.matches ? "dark" : "light";
            setEffective(eff);
            document.documentElement.classList.remove("dark", "light");
            document.documentElement.classList.add(eff);
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    const toggle = () => {
        setTheme(prev => {
            if (prev === "dark") return "light";
            if (prev === "light") return "system";
            return "dark";
        });
    };

    const setDark = () => setTheme("dark");
    const setLight = () => setTheme("light");
    const setSystem = () => setTheme("system");

    return (
        <ThemeContext.Provider value={{ theme, effective, toggle, setDark, setLight, setSystem }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);

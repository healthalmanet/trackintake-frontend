import React, { useEffect, useRef, useState } from "react";
import { Loader } from "lucide-react";

const FoodAutocompleteInput = ({
    value,
    onChange,
    onBlur,
    onFocus,
    onSelect,
    onConfirm,
    results = [],
    loading = false,
    placeholder = "Food Name",
    className = "",
    inputClassName = "",
    disabled = false,
    inputId,
}) => {
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const shouldOpen = Boolean((results?.length || 0) > 0 || loading) && Boolean(String(value ?? "").trim());
        setIsOpen(shouldOpen);
        setHighlightedIndex(-1);
    }, [value, results, loading]);

    useEffect(() => {
        const handlePointerDown = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, []);

    const handleKeyDown = (event) => {
        if (!isOpen || !results?.length) {
            if (event.key === "Enter") {
                event.preventDefault();
                onConfirm?.(event);
                onBlur?.(event);
            }
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightedIndex((prev) => (prev + 1) % results.length);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightedIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
        } else if (event.key === "Enter") {
            event.preventDefault();
            const selected = results[highlightedIndex >= 0 ? highlightedIndex : 0];
            if (selected) {
                setIsOpen(false);
                onSelect?.(selected);
            } else {
                onBlur?.(event);
            }
        } else if (event.key === "Escape") {
            event.preventDefault();
            setIsOpen(false);
        }
    };

    const handleSelectResult = (result) => {
        setIsOpen(false);
        onSelect?.(result);
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <input
                id={inputId}
                type="text"
                value={value ?? ""}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                onBlur={(event) => {
                    window.setTimeout(() => setIsOpen(false), 120);
                    onBlur?.(event);
                }}
                onFocus={(event) => {
                    if (String(value ?? "").trim()) {
                        setIsOpen(Boolean((results?.length || 0) > 0 || loading));
                    }
                    onFocus?.(event);
                }}
                placeholder={placeholder}
                disabled={disabled}
                className={inputClassName}
            />

            {loading && isOpen && (
                <div className="absolute left-0 right-0 mt-1 z-50 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 text-[var(--color-text-muted)] shadow-lg">
                    <div className="flex items-center gap-2">
                        <Loader size={16} className="animate-spin" />
                        Searching...
                    </div>
                </div>
            )}

            {!loading && isOpen && results?.length > 0 && (
                <ul className="absolute left-0 right-0 mt-1 z-50 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-[var(--color-border-default)]/30">
                    {results.map((result, index) => (
                        <li
                            key={String(result.id)}
                            role="button"
                            tabIndex={0}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectResult(result)}
                            className={`px-3.5 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between gap-2 ${highlightedIndex === index
                                ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-semibold"
                                : "text-[var(--color-text-default)] hover:bg-[var(--color-bg-app)]"
                                }`}
                        >
                            <span className="font-medium text-[var(--color-text-strong)] truncate">{result.name}</span>
                            {result.serving_hint && (
                                <span className="text-[11px] text-[var(--color-text-muted)] font-normal whitespace-nowrap bg-[var(--color-bg-app)] px-2 py-0.5 rounded-full border border-[var(--color-border-default)]/50">
                                    {result.serving_hint}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default FoodAutocompleteInput;

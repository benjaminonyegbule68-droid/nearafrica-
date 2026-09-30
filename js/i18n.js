/*
 * NearAfrica — Internationalization Engine
 * File: js/i18n.js
 *
 * Works with:
 *   js/config.js
 *   js/translations.js
 *
 * Supported languages currently:
 *   English, French, Arabic, Portuguese, Swahili
 */

(function () {
    "use strict";

    const DEFAULT_LANGUAGE = "en";

    /*
     * ------------------------------------------------------------
     * BASIC HELPERS
     * ------------------------------------------------------------
     */

    function getConfig() {
        return window.NearAfricaConfig || {};
    }

    function getTranslations() {
        return window.NearAfricaTranslations || {};
    }

    function getLanguageConfig() {
        const config = getConfig();

        return (
            config.languages || {
                enabled: true,
                default: DEFAULT_LANGUAGE,
                supported: ["en"],
                names: {
                    en: "English"
                },
                direction: {
                    en: "ltr"
                },
                browserDetection: true,
                persistence: true,
                storageKey: "nearafrica_language"
            }
        );
    }

    function getSupportedLanguages() {
        const languageConfig = getLanguageConfig();
        const translations = getTranslations();

        const configured = Array.isArray(languageConfig.supported)
            ? languageConfig.supported
            : [DEFAULT_LANGUAGE];

        /*
         * Only expose languages that actually have a dictionary.
         * This prevents the selector from offering a language
         * that has been configured but has no translation data yet.
         */
        return configured.filter(function (language) {
            return !!translations[language];
        });
    }

    function normalizeLanguage(language) {
        if (!language) {
            return DEFAULT_LANGUAGE;
        }

        const value = String(language)
            .trim()
            .toLowerCase()
            .replace("_", "-");

        const baseLanguage = value.split("-")[0];

        const supported = getSupportedLanguages();

        if (supported.includes(value)) {
            return value;
        }

        if (supported.includes(baseLanguage)) {
            return baseLanguage;
        }

        return DEFAULT_LANGUAGE;
    }

    function getStorageKey() {
        const languageConfig = getLanguageConfig();

        return (
            languageConfig.storageKey ||
            "nearafrica_language"
        );
    }

    /*
     * ------------------------------------------------------------
     * STORAGE
     * ------------------------------------------------------------
     */

    function getSavedLanguage() {
        const languageConfig = getLanguageConfig();

        if (languageConfig.persistence === false) {
            return null;
        }

        try {
            const saved = localStorage.getItem(getStorageKey());

            if (!saved) {
                return null;
            }

            const normalized = normalizeLanguage(saved);

            if (getSupportedLanguages().includes(normalized)) {
                return normalized;
            }
        } catch (error) {
            console.warn(
                "NearAfrica i18n: unable to read saved language.",
                error
            );
        }

        return null;
    }

    function saveLanguage(language) {
        const languageConfig = getLanguageConfig();

        if (languageConfig.persistence === false) {
            return;
        }

        try {
            localStorage.setItem(
                getStorageKey(),
                language
            );
        } catch (error) {
            console.warn(
                "NearAfrica i18n: unable to save language.",
                error
            );
        }
    }

    /*
     * ------------------------------------------------------------
     * BROWSER LANGUAGE DETECTION
     * ------------------------------------------------------------
     */

    function detectBrowserLanguage() {
        const languageConfig = getLanguageConfig();

        if (languageConfig.browserDetection === false) {
            return normalizeLanguage(
                languageConfig.default || DEFAULT_LANGUAGE
            );
        }

        const browserLanguages = [];

        if (
            typeof navigator !== "undefined" &&
            Array.isArray(navigator.languages)
        ) {
            browserLanguages.push.apply(
                browserLanguages,
                navigator.languages
            );
        }

        if (
            typeof navigator !== "undefined" &&
            navigator.language
        ) {
            browserLanguages.push(
                navigator.language
            );
        }

        const supported = getSupportedLanguages();

        for (const browserLanguage of browserLanguages) {
            const normalized =
                normalizeLanguage(browserLanguage);

            if (supported.includes(normalized)) {
                return normalized;
            }
        }

        return normalizeLanguage(
            languageConfig.default || DEFAULT_LANGUAGE
        );
    }

    /*
     * ------------------------------------------------------------
     * CURRENT LANGUAGE
     * ------------------------------------------------------------
     */

    let currentLanguage = null;

    function getCurrentLanguage() {
        if (currentLanguage) {
            return currentLanguage;
        }

        const saved = getSavedLanguage();

        if (saved) {
            currentLanguage = saved;
            return currentLanguage;
        }

        currentLanguage = detectBrowserLanguage();

        return currentLanguage;
    }

    /*
     * ------------------------------------------------------------
     * TRANSLATION LOOKUP
     * ------------------------------------------------------------
     */

    function getNestedValue(object, path) {
        if (!object || !path) {
            return undefined;
        }

        const parts = String(path).split(".");

        let value = object;

        for (const part of parts) {
            if (
                value === null ||
                value === undefined ||
                typeof value !== "object"
            ) {
                return undefined;
            }

            if (
                !Object.prototype.hasOwnProperty.call(
                    value,
                    part
                )
            ) {
                return undefined;
            }

            value = value[part];
        }

        return value;
    }

    function getDictionary(language) {
        const translations = getTranslations();

        return (
            translations[language] ||
            translations[DEFAULT_LANGUAGE] ||
            {}
        );
    }

    function translate(key, fallback) {
        if (!key) {
            return fallback || "";
        }

        const language = getCurrentLanguage();
        const translations = getTranslations();

        let value = getNestedValue(
            getDictionary(language),
            key
        );

        /*
         * If the selected language does not contain the key,
         * fall back to English.
         */
        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            value = getNestedValue(
                getDictionary(DEFAULT_LANGUAGE),
                key
            );
        }

        /*
         * If there is still no translation, use the supplied
         * fallback or the key itself.
         */
        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return fallback !== undefined
                ? fallback
                : key;
        }

        return String(value);
    }

    /*
     * ------------------------------------------------------------
     * DOCUMENT DIRECTION
     * ------------------------------------------------------------
     */

    function getDirection(language) {
        const languageConfig = getLanguageConfig();

        const directionMap =
            languageConfig.direction || {};

        return (
            directionMap[language] ||
            "ltr"
        );
    }

    function applyDocumentLanguage(language) {
        if (
            typeof document === "undefined" ||
            !document.documentElement
        ) {
            return;
        }

        const direction =
            getDirection(language);

        document.documentElement.lang =
            language;

        document.documentElement.dir =
            direction;

        document.documentElement.setAttribute(
            "data-language",
            language
        );

        document.documentElement.setAttribute(
            "data-direction",
            direction
        );

        document.body &&
            document.body.setAttribute(
                "data-language",
                language
            );
    }

    /*
     * ------------------------------------------------------------
     * TRANSLATE ELEMENTS
     * ------------------------------------------------------------
     *
     * Supported attributes:
     *
     * data-i18n
     * data-i18n-placeholder
     * data-i18n-title
     * data-i18n-aria-label
     * data-i18n-value
     *
     */

    function translateElement(element) {
        if (!element) {
            return;
        }

        /*
         * Normal text content
         */
        const textKey =
            element.getAttribute("data-i18n");

        if (textKey) {
            const fallback =
                element.dataset.i18nFallback ||
                element.textContent ||
                "";

            const translated =
                translate(
                    textKey,
                    fallback
                );

            element.textContent =
                translated;
        }

        /*
         * Placeholder
         */
        const placeholderKey =
            element.getAttribute(
                "data-i18n-placeholder"
            );

        if (placeholderKey) {
            const fallback =
                element.getAttribute(
                    "placeholder"
                ) || "";

            element.setAttribute(
                "placeholder",
                translate(
                    placeholderKey,
                    fallback
                )
            );
        }

        /*
         * Title
         */
        const titleKey =
            element.getAttribute(
                "data-i18n-title"
            );

        if (titleKey) {
            const fallback =
                element.getAttribute(
                    "title"
                ) || "";

            element.setAttribute(
                "title",
                translate(
                    titleKey,
                    fallback
                )
            );
        }

        /*
         * ARIA label
         */
        const ariaLabelKey =
            element.getAttribute(
                "data-i18n-aria-label"
            );

        if (ariaLabelKey) {
            const fallback =
                element.getAttribute(
                    "aria-label"
                ) || "";

            element.setAttribute(
                "aria-label",
                translate(
                    ariaLabelKey,
                    fallback
                )
            );
        }

        /*
         * Input value
         */
        const valueKey =
            element.getAttribute(
                "data-i18n-value"
            );

        if (valueKey) {
            const fallback =
                element.getAttribute(
                    "value"
                ) || "";

            element.setAttribute(
                "value",
                translate(
                    valueKey,
                    fallback
                )
            );
        }
    }

    function translatePage(root) {
        if (
            typeof document === "undefined"
        ) {
            return;
        }

        const container =
            root || document;

        const elements =
            container.querySelectorAll(
                [
                    "[data-i18n]",
                    "[data-i18n-placeholder]",
                    "[data-i18n-title]",
                    "[data-i18n-aria-label]",
                    "[data-i18n-value]"
                ].join(",")
            );

        elements.forEach(
            translateElement
        );

        updateLanguageSelectors();

        return getCurrentLanguage();
    }

    /*
     * ------------------------------------------------------------
     * LANGUAGE SELECTOR
     * ------------------------------------------------------------
     *
     * Automatically supports:
     *
     * <select id="languageSelector"></select>
     *
     * or:
     *
     * <select data-language-selector></select>
     *
     */

    function getLanguageName(language) {
        const languageConfig =
            getLanguageConfig();

        const names =
            languageConfig.names || {};

        return (
            names[language] ||
            language
        );
    }

    function populateLanguageSelector(
        selector
    ) {
        if (!selector) {
            return;
        }

        const supported =
            getSupportedLanguages();

        if (!supported.length) {
            return;
        }

        /*
         * If the selector already contains options,
         * don't destroy custom markup.
         *
         * If empty, create options automatically.
         */
        if (selector.options.length === 0) {
            supported.forEach(
                function (language) {
                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        language;

                    option.textContent =
                        getLanguageName(
                            language
                        );

                    selector.appendChild(
                        option
                    );
                }
            );
        }

        const current =
            getCurrentLanguage();

        if (
            supported.includes(current)
        ) {
            selector.value =
                current;
        }

        if (
            selector.dataset
                .i18nBound !== "true"
        ) {
            selector.addEventListener(
                "change",
                function () {
                    setLanguage(
                        selector.value
                    );
                }
            );

            selector.dataset.i18nBound =
                "true";
        }
    }

    function updateLanguageSelectors() {
        if (
            typeof document === "undefined"
        ) {
            return;
        }

        const selectors =
            document.querySelectorAll(
                [
                    "#languageSelector",
                    "[data-language-selector]"
                ].join(",")
            );

        selectors.forEach(
            populateLanguageSelector
        );

        /*
         * Also support custom language buttons:
         *
         * <button data-language="fr">
         *     Français
         * </button>
         */
        const buttons =
            document.querySelectorAll(
                "[data-language]"
            );

        buttons.forEach(
            function (button) {
                const language =
                    normalizeLanguage(
                        button.getAttribute(
                            "data-language"
                        )
                    );

                if (
                    button.dataset
                        .i18nLanguageBound !==
                    "true"
                ) {
                    button.addEventListener(
                        "click",
                        function () {
                            setLanguage(
                                language
                            );
                        }
                    );

                    button.dataset
                        .i18nLanguageBound =
                        "true";
                }

                button.setAttribute(
                    "aria-pressed",
                    language ===
                        getCurrentLanguage()
                        ? "true"
                        : "false"
                );
            }
        );
    }

    /*
     * ------------------------------------------------------------
     * SET LANGUAGE
     * ------------------------------------------------------------
     */

    function setLanguage(
        language,
        options
    ) {
        const opts =
            options || {};

        const normalized =
            normalizeLanguage(
                language
            );

        const supported =
            getSupportedLanguages();

        if (
            !supported.includes(
                normalized
            )
        ) {
            console.warn(
                "NearAfrica i18n: unsupported language:",
                language
            );

            return false;
        }

        currentLanguage =
            normalized;

        if (
            opts.persist !== false
        ) {
            saveLanguage(
                normalized
            );
        }

        applyDocumentLanguage(
            normalized
        );

        translatePage();

        /*
         * Let the rest of the website know that
         * the language changed.
         *
         * This is useful for pages that generate
         * dynamic content.
         */
        if (
            typeof window !==
            "undefined" &&
            typeof window.CustomEvent ===
            "function"
        ) {
            window.dispatchEvent(
                new CustomEvent(
                    "nearafrica:languagechange",
                    {
                        detail: {
                            language:
                                normalized
                        }
                    }
                )
            );
        }

        return true;
    }

    /*
     * ------------------------------------------------------------
     * INITIALIZATION
     * ------------------------------------------------------------
     */

    function initI18n() {
        const language =
            getCurrentLanguage();

        applyDocumentLanguage(
            language
        );

        translatePage();

        /*
         * Translate elements added later.
         *
         * This does not continuously translate
         * the whole page. It only watches for
         * newly-added elements.
         */
        if (
            typeof MutationObserver !==
            "undefined" &&
            document.body
        ) {
            const observer =
                new MutationObserver(
                    function (mutations) {
                        mutations.forEach(
                            function (
                                mutation
                            ) {
                                mutation.addedNodes.forEach(
                                    function (
                                        node
                                    ) {
                                        if (
                                            node.nodeType !==
                                            1
                                        ) {
                                            return;
                                        }

                                        /*
                                         * Translate the new
                                         * element itself.
                                         */
                                        if (
                                            node.matches &&
                                            node.matches(
                                                [
                                                    "[data-i18n]",
                                                    "[data-i18n-placeholder]",
                                                    "[data-i18n-title]",
                                                    "[data-i18n-aria-label]",
                                                    "[data-i18n-value]"
                                                ].join(",")
                                            )
                                        ) {
                                            translateElement(
                                                node
                                            );
                                        }

                                        /*
                                         * Translate children.
                                         */
                                        translatePage(
                                            node
                                        );
                                    }
                                );
                            }
                        );
                    }
                );

            observer.observe(
                document.body,
                {
                    childList: true,
                    subtree: true
                }
            );
        }

        return language;
    }

    /*
     * ------------------------------------------------------------
     * PUBLIC API
     * ------------------------------------------------------------
     */

    window.NearAfricaI18n = {
        init: initI18n,

        getCurrentLanguage:
            getCurrentLanguage,

        setLanguage:
            setLanguage,

        translate:
            translate,

        translatePage:
            translatePage,

        translateElement:
            translateElement,

        detectBrowserLanguage:
            detectBrowserLanguage,

        getSupportedLanguages:
            getSupportedLanguages,

        getLanguageName:
            getLanguageName,

        getDirection:
            getDirection
    };

    /*
     * ------------------------------------------------------------
     * AUTO START
     * ------------------------------------------------------------
     */

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initI18n
        );
    } else {
        initI18n();
    }

})();

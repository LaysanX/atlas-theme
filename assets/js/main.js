document.addEventListener("DOMContentLoaded", function () {
    // Older uploaded-theme renderers emitted local uploads as file:// URLs.
    document.querySelectorAll("img[src], [data-gallery-image], [data-gallery-src]").forEach(function (element) {
        ["src", "data-gallery-image", "data-gallery-src"].forEach(function (attribute) {
            var value = element.getAttribute(attribute);
            if (!value || !/^file:\/\//i.test(value)) return;
            var uploadsIndex = value.toLowerCase().indexOf("/uploads/");
            if (uploadsIndex >= 0) element.setAttribute(attribute, value.slice(uploadsIndex));
        });
    });

    var menuToggle = document.getElementById("menuToggle");
    var siteMenu = document.getElementById("siteMenu");

    if (menuToggle && siteMenu) {
        menuToggle.addEventListener("click", function () {
            var isOpen = siteMenu.classList.toggle("is-open");
            menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });
    }

    var slider = document.querySelector("[data-hero-slides], [data-slider]");
    if (slider) {
        var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide], [data-slide]"));
        var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot], [data-slide-dot]"));
        var activeIndex = 0;
        var intervalId = null;

        var setActiveSlide = function (index) {
            if (!slides.length) {
                return;
            }

            activeIndex = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === activeIndex);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === activeIndex);
            });
        };

        var startSlider = function () {
            if (slides.length < 2) {
                return;
            }

            intervalId = window.setInterval(function () {
                setActiveSlide(activeIndex + 1);
            }, 5500);
        };

        var stopSlider = function () {
            if (intervalId) {
                window.clearInterval(intervalId);
                intervalId = null;
            }
        };

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener("click", function () {
                stopSlider();
                setActiveSlide(dotIndex);
                startSlider();
            });
        });

        slider.addEventListener("mouseenter", stopSlider);
        slider.addEventListener("mouseleave", startSlider);

        setActiveSlide(0);
        startSlider();
    }

    var accordionGroups = document.querySelectorAll("[data-accordion]");

    document.querySelectorAll("[data-product-gallery-shell]").forEach(function (gallery) {
        var mainImage = gallery.querySelector("[data-gallery-main-image]");
        if (!mainImage) return;
        gallery.querySelectorAll("[data-gallery-image]").forEach(function (thumb) {
            thumb.addEventListener("click", function () {
                var image = thumb.getAttribute("data-gallery-image");
                if (!image) return;
                mainImage.src = image;
                gallery.querySelectorAll("[data-gallery-image]").forEach(function (item) {
                    item.classList.toggle("is-active", item === thumb);
                });
            });
        });
    });

    document.querySelectorAll("[data-atlas-product-form]").forEach(function (form) {
        var variants;
        try { variants = JSON.parse(form.getAttribute("data-variants") || "[]"); }
        catch (_) { variants = []; }
        var groups = Array.prototype.slice.call(form.querySelectorAll("[data-variant-group]"));
        var groupButtons = Array.prototype.slice.call(form.querySelectorAll("[data-variant-key]"));
        var directButtons = Array.prototype.slice.call(form.querySelectorAll("[data-variant-id]"));
        var selected = {};
        var variantInput = form.querySelector("[data-selected-variant]");
        var submitButton = form.querySelector("[data-add-to-cart]");
        var status = form.querySelector("[data-variant-status]");
        var price = document.querySelector("[data-product-price]");
        var compare = document.querySelector("[data-product-base-compare]");
        var gallery = document.querySelector("[data-product-gallery-shell]");
        var mainImage = gallery && gallery.querySelector("[data-gallery-main-image]");
        var defaultImage = mainImage && mainImage.getAttribute("src");
        var defaultPrice = price && price.textContent;
        var defaultCompare = compare && compare.textContent;

        form.querySelectorAll("[data-swatch-color]").forEach(function (swatch) {
            var color = swatch.getAttribute("data-swatch-color") || "";
            swatch.style.backgroundColor = /^#[0-9a-f]{3,8}$/i.test(color) ? color : "#cbd5e1";
        });

        function matches(variant, overrideKey, overrideValue) {
            var attrs = variant.attributes || {};
            return groups.every(function (group) {
                var key = group.getAttribute("data-variant-group");
                var wanted = key === overrideKey ? overrideValue : selected[key];
                return !wanted || attrs[key] === wanted;
            });
        }

        function syncGallery(image) {
            if (!mainImage) return;
            mainImage.src = image || defaultImage || mainImage.src;
            gallery.querySelectorAll("[data-gallery-image]").forEach(function (thumb) {
                thumb.classList.toggle("is-active", thumb.getAttribute("data-gallery-image") === mainImage.getAttribute("src"));
            });
        }

        function sync() {
            groupButtons.forEach(function (button) {
                var key = button.getAttribute("data-variant-key");
                var value = button.getAttribute("data-variant-value");
                var possible = variants.some(function (variant) { return matches(variant, key, value); });
                button.disabled = !possible;
                button.classList.toggle("is-active", selected[key] === value);
                button.setAttribute("aria-pressed", selected[key] === value ? "true" : "false");
            });
            groups.forEach(function (group) {
                var key = group.getAttribute("data-variant-group");
                var label = group.querySelector("[data-variant-selection]");
                if (label) label.textContent = selected[key] || "Choose";
            });

            var complete = groups.length && groups.every(function (group) { return !!selected[group.getAttribute("data-variant-group")]; });
            var variant = complete ? variants.find(function (item) { return matches(item); }) : null;
            if (!groups.length && directButtons.length) {
                variant = variants.find(function (item) { return String(item.id) === variantInput.value; }) || null;
            }
            variantInput.value = variant && variant.available ? variant.id : "";
            if (submitButton) submitButton.disabled = !variantInput.value && variants.length > 0;
            if (status) status.textContent = variant ? (variant.available ? (variant.stock_quantity > 0 ? "In stock: " + variant.stock_quantity : "Available to order") + (variant.sku ? " · SKU: " + variant.sku : "") : "Out of stock") : "Select your options to see availability.";
            if (price) price.textContent = variant && variant.primary_price_formatted ? variant.primary_price_formatted : defaultPrice;
            if (compare) {
                compare.textContent = variant && variant.compare_at_price_formatted ? variant.compare_at_price_formatted : defaultCompare;
                compare.hidden = !!variant && !variant.compare_at_price_formatted;
            }
            syncGallery(variant && variant.image);
        }

        groupButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                var key = button.getAttribute("data-variant-key");
                var value = button.getAttribute("data-variant-value");
                if (button.disabled) return;
                if (selected[key] === value) delete selected[key];
                else selected[key] = value;
                sync();
            });
        });
        directButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                if (button.disabled) return;
                variantInput.value = button.getAttribute("data-variant-id");
                directButtons.forEach(function (item) {
                    var active = item === button;
                    item.classList.toggle("is-active", active);
                    item.setAttribute("aria-pressed", active ? "true" : "false");
                });
                sync();
            });
        });
        form.addEventListener("submit", function (event) {
            if (variants.length && !variantInput.value) event.preventDefault();
        });
        if (variants.length) sync();
    });

    accordionGroups.forEach(function (group) {
        var items = Array.prototype.slice.call(group.querySelectorAll(".faq-item"));

        items.forEach(function (item) {
            var trigger = item.querySelector("[data-accordion-trigger]");
            if (!trigger) {
                return;
            }

            trigger.addEventListener("click", function () {
                var isOpen = item.classList.contains("is-open");
                items.forEach(function (entry) { entry.classList.remove("is-open"); });
                if (!isOpen) {
                    item.classList.add("is-open");
                }
            });
        });
    });

    var revealItems = document.querySelectorAll("[data-reveal]");
    if (revealItems.length) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });

        revealItems.forEach(function (item, index) {
            item.style.transitionDelay = Math.min(index * 45, 260) + "ms";
            revealObserver.observe(item);
        });
    }

    var counterItems = Array.prototype.slice.call(document.querySelectorAll("[data-countup]"));
    if (counterItems.length) {
        var animateCount = function (item) {
            if (item.getAttribute("data-countup-done") === "true") {
                return;
            }

            var target = parseInt(item.getAttribute("data-countup-target") || "0", 10);
            var suffix = item.getAttribute("data-countup-suffix") || "";

            if (!target || target < 1) {
                item.textContent = "0" + suffix;
                item.setAttribute("data-countup-done", "true");
                return;
            }

            var duration = 1400;
            var start = null;

            var tick = function (timestamp) {
                if (!start) {
                    start = timestamp;
                }

                var progress = Math.min((timestamp - start) / duration, 1);
                var eased = 1 - Math.pow(1 - progress, 3);
                var value = Math.floor(target * eased);
                item.textContent = value.toLocaleString() + suffix;

                if (progress < 1) {
                    window.requestAnimationFrame(tick);
                } else {
                    item.textContent = target.toLocaleString() + suffix;
                    item.setAttribute("data-countup-done", "true");
                }
            };

            window.requestAnimationFrame(tick);
        };

        var counterObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.35 });

        counterItems.forEach(function (item) {
            counterObserver.observe(item);
        });
    }

    var heroShell = document.querySelector(".hero-shell");
    if (heroShell && window.matchMedia("(min-width: 992px)").matches) {
        heroShell.addEventListener("mousemove", function (event) {
            var bounds = heroShell.getBoundingClientRect();
            var x = (event.clientX - bounds.left) / bounds.width - 0.5;
            var y = (event.clientY - bounds.top) / bounds.height - 0.5;
            heroShell.style.setProperty("--hero-tilt-x", (x * 10).toFixed(2) + "px");
            heroShell.style.setProperty("--hero-tilt-y", (y * 10).toFixed(2) + "px");
        });

        heroShell.addEventListener("mouseleave", function () {
            heroShell.style.setProperty("--hero-tilt-x", "0px");
            heroShell.style.setProperty("--hero-tilt-y", "0px");
        });
    }

    var normalizeGalleryCategory = function (value) {
        return (value || "").trim().toLocaleLowerCase();
    };

    Array.prototype.slice.call(document.querySelectorAll("[data-gallery-collection]")).forEach(function (collection) {
        var filterBar = collection.querySelector("[data-gallery-filters]");
        var cards = Array.prototype.slice.call(collection.querySelectorAll("[data-gallery-item]"));
        if (!filterBar || !cards.length) {
            return;
        }

        var categories = new Map();
        cards.forEach(function (card) {
            var category = (card.getAttribute("data-gallery-category") || "").trim();
            var key = normalizeGalleryCategory(category);
            if (key && !categories.has(key)) {
                categories.set(key, category);
            }
        });

        categories.forEach(function (label, key) {
            var button = document.createElement("button");
            button.type = "button";
            button.className = "gallery-filter-tab";
            button.setAttribute("data-gallery-filter", key);
            button.setAttribute("aria-pressed", "false");
            button.textContent = label;
            filterBar.appendChild(button);
        });

        Array.prototype.slice.call(filterBar.querySelectorAll("[data-gallery-filter]")).forEach(function (button) {
            button.addEventListener("click", function () {
                var filter = button.getAttribute("data-gallery-filter") || "all";
                Array.prototype.slice.call(filterBar.querySelectorAll("[data-gallery-filter]")).forEach(function (item) {
                    var active = item === button;
                    item.classList.toggle("is-active", active);
                    item.setAttribute("aria-pressed", active ? "true" : "false");
                });
                cards.forEach(function (card) {
                    card.hidden = filter !== "all" && normalizeGalleryCategory(card.getAttribute("data-gallery-category")) !== filter;
                });
            });
        });
    });

    var galleryLightbox = document.querySelector("[data-gallery-lightbox]");
    if (galleryLightbox) {
        var galleryTriggers = Array.prototype.slice.call(document.querySelectorAll("[data-gallery-trigger]"));
        var galleryImage = galleryLightbox.querySelector("[data-gallery-image]");
        var galleryTitle = galleryLightbox.querySelector("[data-gallery-title]");
        var galleryCategory = galleryLightbox.querySelector("[data-gallery-category]");
        var galleryClose = galleryLightbox.querySelector("[data-gallery-close]");
        var galleryPrev = galleryLightbox.querySelector("[data-gallery-prev]");
        var galleryNext = galleryLightbox.querySelector("[data-gallery-next]");
        var galleryIndex = 0;
        var activeGalleryCollection = null;
        var activeGalleryTriggers = galleryTriggers.slice();
        var galleryPreviousOverflow = "";
        var galleryPreviousFocus = null;

        var refreshActiveGalleryTriggers = function () {
            activeGalleryTriggers = galleryTriggers.filter(function (trigger) {
                if (trigger.closest("[data-gallery-collection]") !== activeGalleryCollection) {
                    return false;
                }
                var card = trigger.closest("[data-gallery-item]");
                if (!card) {
                    return true;
                }

                return !card.hidden;
            });
            if (galleryPrev) galleryPrev.disabled = activeGalleryTriggers.length < 2;
            if (galleryNext) galleryNext.disabled = activeGalleryTriggers.length < 2;
        };

        var renderGalleryItem = function (index) {
            refreshActiveGalleryTriggers();

            if (!activeGalleryTriggers.length || !galleryImage) {
                return;
            }

            galleryIndex = (index + activeGalleryTriggers.length) % activeGalleryTriggers.length;
            var trigger = activeGalleryTriggers[galleryIndex];
            var src = trigger.getAttribute("data-gallery-src") || "";
            var title = trigger.getAttribute("data-gallery-title") || "";
            var category = trigger.getAttribute("data-gallery-category") || "";

            galleryImage.setAttribute("src", src);
            galleryImage.setAttribute("alt", title);

            if (galleryTitle) {
                galleryTitle.textContent = title;
            }

            if (galleryCategory) {
                galleryCategory.textContent = category;
            }
        };

        var openGallery = function (trigger) {
            activeGalleryCollection = trigger.closest("[data-gallery-collection]");
            refreshActiveGalleryTriggers();
            var activeIndex = activeGalleryTriggers.indexOf(trigger);
            if (activeIndex < 0) return;
            renderGalleryItem(activeIndex);
            galleryPreviousFocus = document.activeElement;
            galleryPreviousOverflow = document.body.style.overflow;
            galleryLightbox.classList.add("is-open");
            galleryLightbox.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
            if (galleryClose) galleryClose.focus();
        };

        var closeGallery = function () {
            galleryLightbox.classList.remove("is-open");
            galleryLightbox.setAttribute("aria-hidden", "true");
            document.body.style.overflow = galleryPreviousOverflow;
            if (galleryPreviousFocus && galleryPreviousFocus.focus) galleryPreviousFocus.focus();
        };

        galleryTriggers.forEach(function (trigger) {
            trigger.addEventListener("click", function () {
                openGallery(trigger);
            });
        });

        if (galleryClose) {
            galleryClose.addEventListener("click", closeGallery);
        }

        if (galleryPrev) {
            galleryPrev.addEventListener("click", function () {
                renderGalleryItem(galleryIndex - 1);
            });
        }

        if (galleryNext) {
            galleryNext.addEventListener("click", function () {
                renderGalleryItem(galleryIndex + 1);
            });
        }

        galleryLightbox.addEventListener("click", function (event) {
            if (event.target === galleryLightbox) {
                closeGallery();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (!galleryLightbox.classList.contains("is-open")) {
                return;
            }

            if (event.key === "Escape") {
                closeGallery();
            } else if (event.key === "ArrowLeft") {
                renderGalleryItem(galleryIndex - 1);
            } else if (event.key === "ArrowRight") {
                renderGalleryItem(galleryIndex + 1);
            }
        });
    }

    var conversionModal = document.querySelector("[data-conversion-modal]");
    if (conversionModal) {
        var openConversionModal = function () {
            conversionModal.classList.add("is-open");
            conversionModal.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
        };

        var closeConversionModal = function () {
            conversionModal.classList.remove("is-open");
            conversionModal.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
        };

        document.addEventListener("click", function (event) {
            var openTrigger = event.target.closest("[data-conversion-open]");
            if (openTrigger) {
                event.preventDefault();
                openConversionModal();
                return;
            }

            var closeTrigger = event.target.closest("[data-conversion-close]");
            if (closeTrigger) {
                event.preventDefault();
                closeConversionModal();
            }
        });

        conversionModal.addEventListener("click", function (event) {
            if (event.target === conversionModal) {
                closeConversionModal();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (!conversionModal.classList.contains("is-open")) {
                return;
            }

            if (event.key === "Escape") {
                closeConversionModal();
            }
        });
    }

    var welcomePopup = document.getElementById("welcomePopupOverlay");
    if (welcomePopup) {
        var popupKey = welcomePopup.getAttribute("data-once-key") || "welcome-popup";
        var popupFrequency = (welcomePopup.getAttribute("data-display-frequency") || "once").toLowerCase();
        var popupDelay = Math.max(0, parseInt(welcomePopup.getAttribute("data-delay-seconds") || "0", 10)) * 1000;
        var popupWasShown = popupFrequency === "once" && window.localStorage.getItem(popupKey) === "1";
        var showWelcomePopup = function () {
            if (popupWasShown) {
                return;
            }

            welcomePopup.classList.remove("d-none");
            welcomePopup.classList.add("is-open");
            welcomePopup.setAttribute("aria-hidden", "false");
            if (popupFrequency === "once") {
                window.localStorage.setItem(popupKey, "1");
            }
        };
        var closeWelcomePopup = function () {
            welcomePopup.classList.remove("is-open");
            welcomePopup.classList.add("d-none");
            welcomePopup.setAttribute("aria-hidden", "true");
        };

        window.setTimeout(showWelcomePopup, popupDelay);
        document.addEventListener("click", function (event) {
            if (event.target.closest("#welcomePopupClose") || event.target === welcomePopup) {
                closeWelcomePopup();
            }
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && welcomePopup.classList.contains("is-open")) {
                closeWelcomePopup();
            }
        });
    }
});

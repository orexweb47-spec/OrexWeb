/* ==========================================================================
   OREXWEB — MAIN JS
   Sections: Navigation | Mobile Menu | Hero Animation | Scroll Reveals |
             Marquee | Process Timeline | Service Stack | FAQ | Reduced Motion
   ========================================================================== */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ------------------------------------------------------------------ */
  /* Navigation — scroll shadow + active link                            */
  /* ------------------------------------------------------------------ */
  const header = document.getElementById("site-header");
  const navLinks = document.querySelectorAll(".nav-links a");
  const sections = Array.from(document.querySelectorAll("main section[id]"));

  function onScrollNav() {
    if (window.scrollY > 12) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }

    let current = "";
    const scrollPos = window.scrollY + window.innerHeight * 0.35;
    sections.forEach((sec) => {
      if (scrollPos >= sec.offsetTop) current = sec.id;
    });
    navLinks.forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === `#${current}`);
    });
  }
  document.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* ------------------------------------------------------------------ */
  /* Mobile Menu                                                         */
  /* ------------------------------------------------------------------ */
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobile-menu");

  function closeMenu() {
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("open");
    document.body.classList.remove("menu-open");
  }
  function toggleMenu() {
    const isOpen = mobileMenu.classList.toggle("open");
    hamburger.classList.toggle("open", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  }
  hamburger.addEventListener("click", toggleMenu);
  mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

  /* ------------------------------------------------------------------ */
  /* Hero Animation (page load sequence)                                 */
  /* ------------------------------------------------------------------ */
  function playHeroIntro() {
    const lines = document.querySelectorAll(".hero-heading .line");
    const badge = document.querySelector(".badge");
    const cta = document.querySelector(".hero-cta");
    const device = document.querySelector(".hero-visual");

    if (prefersReducedMotion || !hasGSAP) {
      badge.style.opacity = 1;
      cta.style.opacity = 1;
      device.style.opacity = 1;
      lines.forEach((l) => (l.style.transform = "none"));
      return;
    }

    lines.forEach((l) => {
      l.style.display = "block";
      l.querySelectorAll(":scope").forEach(() => {});
    });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(".nav-container", { opacity: 1, y: 0, duration: 0.5 }, 0.1)
      .fromTo(badge, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 }, 0.3)
      .fromTo(
        lines,
        { yPercent: 110 },
        { yPercent: 0, duration: 0.7, stagger: 0.12 },
        0.45
      )
      .fromTo(cta, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 }, 1.0)
      .fromTo(
        device,
        { x: 40, y: 20, opacity: 0 },
        { x: 0, y: 0, opacity: 1, duration: 0.9 },
        0.6
      );
  }
  playHeroIntro();

  /* ------------------------------------------------------------------ */
  /* Marquee — idle speed / faster on scroll                             */
  /* ------------------------------------------------------------------ */
  const marqueeTracks = document.querySelectorAll(".marquee-track");
  let marqueeTimeout;
  if (!prefersReducedMotion) {
    document.addEventListener(
      "scroll",
      () => {
        marqueeTracks.forEach((t) => t.style.animationDuration = "14s");
        clearTimeout(marqueeTimeout);
        marqueeTimeout = setTimeout(() => {
          marqueeTracks.forEach((t) => (t.style.animationDuration = "26s"));
        }, 350);
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------------ */
  /* Generic Scroll Reveals (IntersectionObserver)                       */
  /* ------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll('[data-reveal="fade"], [data-reveal="stagger"], .work-card');

  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const parent = entry.target.closest("ul, .work-grid, .accordion");
            if (parent && entry.target.dataset.reveal === "stagger") {
              const siblings = Array.from(parent.children).filter((c) =>
                c.matches('[data-reveal="stagger"], .work-card')
              );
              const index = siblings.indexOf(entry.target);
              entry.target.style.transitionDelay = `${index * 0.1}s`;
            }
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* Image / CTA clip reveals */
  const clipEls = document.querySelectorAll('[data-reveal="clip"]');
  if (prefersReducedMotion) {
    clipEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const clipObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            clipObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    clipEls.forEach((el) => clipObserver.observe(el));
  }

  /* ------------------------------------------------------------------ */
  /* Process Timeline — geometry from real node centers + staged reveal */
  /* ------------------------------------------------------------------ */
  const timeline = document.getElementById("timeline");
  const timelineLine = document.getElementById("timeline-line");
  const timelineSteps = Array.from(document.querySelectorAll(".timeline-step"));
  const timelineNodes = Array.from(document.querySelectorAll(".timeline-node"));
  const timelineParas = Array.from(document.querySelectorAll(".timeline-step p"));

  function isVerticalTimeline() {
    return window.matchMedia("(max-width: 700px)").matches;
  }

  // The line's position/length is always measured from the actual rendered
  // node centers (never guessed with percentages), so it passes exactly
  // through the middle of every circle at any viewport width.
  function positionTimelineLine() {
    if (!timeline || !timelineLine || timelineNodes.length < 2) return;

    const containerRect = timeline.getBoundingClientRect();
    const firstRect = timelineNodes[0].getBoundingClientRect();
    const lastRect = timelineNodes[timelineNodes.length - 1].getBoundingClientRect();

    if (isVerticalTimeline()) {
      const x = firstRect.left + firstRect.width / 2 - containerRect.left;
      const topY = firstRect.top + firstRect.height / 2 - containerRect.top;
      const bottomY = lastRect.top + lastRect.height / 2 - containerRect.top;
      timelineLine.style.left = `${x}px`;
      timelineLine.style.top = `${topY}px`;
      timelineLine.style.height = `${Math.max(bottomY - topY, 0)}px`;
    } else {
      const y = firstRect.top + firstRect.height / 2 - containerRect.top;
      const xStart = firstRect.left + firstRect.width / 2 - containerRect.left;
      const xEnd = lastRect.left + lastRect.width / 2 - containerRect.left;
      timelineLine.style.top = `${y}px`;
      timelineLine.style.left = `${xStart}px`;
      timelineLine.style.width = `${Math.max(xEnd - xStart, 0)}px`;
      timelineLine.style.height = "4px";
    }
  }

  function revealTimeline() {
    if (prefersReducedMotion) {
      timelineLine && timelineLine.classList.add("is-drawn");
      timelineNodes.forEach((n) => n.classList.add("is-visible"));
      timelineParas.forEach((p) => p.classList.add("is-visible"));
      return;
    }
    positionTimelineLine();
    timelineLine && timelineLine.classList.add("is-drawn");
    timelineNodes.forEach((node, i) => {
      setTimeout(() => {
        node.classList.add("is-visible");
        if (timelineParas[i]) timelineParas[i].classList.add("is-visible");
      }, 250 + i * 160);
    });
  }

  if (timeline) {
    // Measure as soon as layout is ready, then again after web fonts load
    // (font swaps can shift title heights and therefore node centers).
    positionTimelineLine();
    window.addEventListener("load", positionTimelineLine);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(positionTimelineLine);
    }

    let timelineResizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(timelineResizeTimer);
      timelineResizeTimer = setTimeout(positionTimelineLine, 150);
    });

    const timelineObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealTimeline();
            timelineObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    timelineObserver.observe(timeline);
  }

  /* ------------------------------------------------------------------ */
  /* Service Stack — scroll-driven stacked cards                        */
  /* ------------------------------------------------------------------ */
  const stack = document.getElementById("services-stack");
  const cards = stack ? Array.from(stack.querySelectorAll(".service-card")) : [];

  function initServiceStack() {
    if (!cards.length) return;

    if (prefersReducedMotion || !hasGSAP) {
      // Fallback: normal static stacked cards, no pin/scroll effect.
      cards.forEach((c) => {
        c.style.position = "relative";
        c.style.top = "0";
      });
      return;
    }

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const stackOffset = isMobile ? 14 : 22;
    const scaleStep = isMobile ? 0.02 : 0.03;

    cards.forEach((card, i) => {
      card.style.top = `${(isMobile ? 90 : 110) + i * stackOffset}px`;
      if (i < cards.length - 1) {
        gsap.set(card, { scale: 1 - (cards.length - 1 - i) * 0 }); // reset base
      }
    });

    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;
      ScrollTrigger.create({
        trigger: cards[i + 1],
        start: "top bottom",
        end: "top top",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          gsap.set(card, {
            scale: 1 - p * scaleStep * (cards.length - i),
            y: -p * (isMobile ? 10 : 18),
            opacity: 1 - p * 0.15,
          });
        },
      });
    });

    ScrollTrigger.addEventListener("refreshInit", () => {});
  }

  initServiceStack();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (hasGSAP) ScrollTrigger.refresh();
    }, 250);
  });

  /* ------------------------------------------------------------------ */
  /* FAQ Accordion                                                       */
  /* ------------------------------------------------------------------ */
  const accordionItems = document.querySelectorAll(".accordion-item");

  accordionItems.forEach((item) => {
    const trigger = item.querySelector(".accordion-trigger");
    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      accordionItems.forEach((other) => {
        other.classList.remove("is-open");
        other.querySelector(".accordion-trigger").setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  // Open first FAQ by default (matches design)
  if (accordionItems.length) {
    accordionItems[0].classList.add("is-open");
  }

  /* ------------------------------------------------------------------ */
  /* Footer year                                                         */
  /* ------------------------------------------------------------------ */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();

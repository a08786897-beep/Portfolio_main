(function () {
  const api = window.PortfolioAPI;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function showMessage(container, message, kind = "muted") {
    if (!container) return;
    container.replaceChildren(make("p", `${kind} api-message`, message));
  }

  function safeLink(url, label, className) {
    const safeUrl = safeWebUrl(url);
    if (!safeUrl) return null;
    const link = make("a", className, label);
    link.href = safeUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  function safeWebUrl(value, allowRelative = false) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const parsed = new URL(value, window.location.origin);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
      if (allowRelative && !/^[a-z][a-z\d+.-]*:/i.test(value) && parsed.origin === window.location.origin) {
        return value;
      }
      return /^[a-z][a-z\d+.-]*:/i.test(value) ? parsed.href : null;
    } catch {
      return null;
    }
  }

  function renderProjects(projects) {
    const grid = $("#projectsGrid");
    grid.replaceChildren();
    const projectStat = $('[data-stat="projects"]');
    if (projectStat) projectStat.textContent = String(projects.length);
    if (!projects.length) {
      showMessage(grid, "Projects will appear here once they have been added.");
      return;
    }

    projects.forEach((project) => {
      const card = make("article", "glass-card project-card");
      const media = make("div", "project-media");
      const imageUrl = safeWebUrl(project.image, true);
      if (imageUrl) {
        const image = make("img", "project-image");
        image.alt = `${project.title} preview`;
        image.loading = "lazy";
        image.addEventListener("error", () => {
          if (image.parentNode === media) {
            image.replaceWith(make("div", "media-placeholder", project.title));
          }
        }, { once: true });
        image.src = imageUrl;
        media.append(image);
      } else {
        media.append(make("div", "media-placeholder", project.title));
      }
      media.append(make("div", "media-badge", project.category || (project.technologies || []).join(" • ")));

      const body = make("div", "project-body");
      body.append(make("h3", "project-title", project.title));
      body.append(make("p", "project-desc", project.description));
      const technologies = make("div", "tech-row");
      (project.technologies || []).forEach((technology) => technologies.append(make("span", "tech", technology)));
      body.append(technologies);

      const actions = make("div", "project-actions");
      const github = safeLink(project.githubUrl, "GitHub", "btn btn-ghost");
      const demo = safeLink(project.liveDemoUrl, "Live Demo", "btn btn-primary");
      if (github) actions.append(github);
      if (demo) actions.append(demo);
      if (actions.childElementCount) body.append(actions);
      card.append(media, body);
      grid.append(card);
    });

  }

  function renderSkills(skills) {
    const list = $("#skillsList");
    if (!list) return;
    list.replaceChildren();
    if (!skills.length) {
      showMessage(list, "Skills will appear here once they have been added.");
      return;
    }

    skills.forEach((skill) => {
      const item = make("div", "skill");
      const top = make("div", "skill-top");
      top.append(make("span", "skill-name", skill.name));
      top.append(make("span", "skill-pct", `${skill.percentage}%`));
      const bar = make("div", "bar");
      bar.setAttribute("role", "progressbar");
      bar.setAttribute("aria-valuemin", "0");
      bar.setAttribute("aria-valuemax", "100");
      bar.setAttribute("aria-valuenow", String(skill.percentage));
      bar.setAttribute("aria-label", skill.name);
      const fill = make("span", "bar-fill");
      fill.dataset.fill = String(skill.percentage);
      bar.append(fill);
      item.append(top, bar);
      list.append(item);
    });
    animateSkillBars();
  }

  function renderTimeline(container, entries, titleKey, organizationKey) {
    if (!container) return;
    container.replaceChildren();
    if (!entries.length) {
      showMessage(container, "No records have been added yet.");
      return;
    }
    entries.forEach((entry) => {
      const item = make("div", "t-item");
      item.append(make("div", "t-dot"));
      const body = make("div", "t-body");
      body.append(make("div", "t-title", entry[titleKey]));
      const dates = [entry.startDate, entry.current ? "Present" : entry.endDate].filter(Boolean).join(" — ");
      const organization = [entry[organizationKey], entry.location].filter(Boolean).join(" • ");
      if (organization || dates) body.append(make("div", "t-sub", [organization, dates].filter(Boolean).join(" • ")));
      if (entry.description) body.append(make("div", "t-meta", entry.description));
      item.append(body);
      container.append(item);
    });
  }

  function renderServices(services) {
    const list = $("#servicesList");
    if (!list) return;
    list.replaceChildren();
    if (!services.length) {
      showMessage(list, "Services will appear here once they have been added.");
      return;
    }
    services.forEach((service) => {
      const card = make("article", "glass-card");
      card.append(make("h3", "card-title", service.title));
      card.append(make("p", "muted", service.description));
      list.append(card);
    });
  }

  function renderCertifications(certifications) {
    const list = $("#certificationsList");
    if (!list) return;
    list.replaceChildren();
    if (!certifications.length) {
      showMessage(list, "No certifications have been added yet.");
      return;
    }

    certifications.forEach((certification) => {
      const card = make("article", "glass-card");
      card.append(make("h3", "card-title", certification.name));
      if (certification.issuer) card.append(make("p", "muted", certification.issuer));
      if (certification.issueDate) card.append(make("p", "muted", certification.issueDate));
      const credential = safeLink(certification.credentialUrl, "View credential", "btn btn-ghost");
      if (credential) card.append(credential);
      list.append(card);
    });
  }

  function applyProfile(profile) {
    if (!profile) return;
    if (profile.name) {
      const name = $(".hero-title .name");
      if (name) name.textContent = profile.name;
      const brand = $(".brand-text");
      if (brand) brand.textContent = profile.name.replace(/\s+/g, "");
      const footerName = $(".footer-brand span:last-child");
      if (footerName) footerName.textContent = profile.name;
      document.title = `${profile.name} | Portfolio`;
    }
    if (profile.headline) {
      const headline = $("#typingText");
      if (headline) headline.textContent = profile.headline;
    }
    if (profile.subtitle) {
      const subtitle = $(".hero-subtitle");
      if (subtitle) subtitle.textContent = profile.subtitle;
    }
    if (profile.about) {
      const about = $("#about .section-desc");
      if (about) about.textContent = profile.about;
    }
    if (profile.email) {
      $$('.contact-details a[href^="mailto:"]').forEach((link) => {
        link.href = `mailto:${profile.email}`;
        link.textContent = profile.email;
      });
      $("#copyEmailBtn")?.setAttribute("data-email", profile.email);
    }
    if (profile.phone) {
      $$('.contact-details a[href^="tel:"]').forEach((link) => {
        link.href = `tel:${profile.phone.replace(/[^\d+]/g, "")}`;
        link.textContent = profile.phone;
      });
    }
    if (profile.location) {
      const location = $$(".contact-details .detail")[2]?.querySelector(".detail-link");
      if (location) location.textContent = profile.location;
    }
    if (profile.resumeUrl) {
      const resumeUrl = safeWebUrl(profile.resumeUrl, true);
      const download = $("#downloadResumeBtn");
      const heroResume = $("#heroResumeBtn");
      const preview = $(".resume-file");
      if (resumeUrl && download) {
        [download, heroResume].filter(Boolean).forEach((link) => {
          link.href = resumeUrl;
          link.removeAttribute("aria-disabled");
          link.removeAttribute("tabindex");
          if (new URL(resumeUrl, window.location.origin).origin === window.location.origin) {
            link.setAttribute("download", "");
          } else {
            link.removeAttribute("download");
            link.target = "_blank";
            link.rel = "noopener noreferrer";
          }
        });
        download.textContent = "Download Resume (PDF)";
        download.setAttribute("aria-label", "Download resume");
        if (heroResume) {
          heroResume.textContent = "Download Resume";
          heroResume.setAttribute("aria-label", "Download resume");
        }
        if (preview) preview.textContent = "Resume ready to download";
      }
    }
    if (Array.isArray(profile.socialLinks)) {
      const links = new Map(profile.socialLinks.map((item) => [
        String(item.label || "").trim().toLowerCase(),
        item.url
      ]));
      $$("[data-social]").forEach((link) => {
        const label = link.dataset.social;
        const configuredUrl = links.get(label);
        const safeUrl = configuredUrl ? safeWebUrl(configuredUrl) : null;
        if (safeUrl) {
          link.href = safeUrl;
          link.hidden = false;
        }
        else if (label === "linkedin" || configuredUrl) link.hidden = true;
      });
    }
  }

  async function loadPortfolio() {
    try {
      const response = await api.get("/portfolio");
      const data = response.data;
      applyProfile(data.profile);
      renderSkills(data.skills);
      renderTimeline($("#educationList"), data.education, "degree", "institution");
      renderTimeline($("#experienceList"), data.experience, "title", "company");
      renderServices(data.services);
      renderCertifications(data.certifications || []);
    } catch (error) {
      ["#skillsList", "#educationList", "#experienceList", "#servicesList", "#certificationsList"].forEach((selector) => {
        showMessage($(selector), error.message, "field-error");
      });
    }
  }

  async function loadProjects() {
    const grid = $("#projectsGrid");
    if (!grid) return;
    showMessage(grid, "Loading projects…");
    try {
      const response = await api.get("/projects");
      renderProjects(response.data);
    } catch (error) {
      showMessage(grid, error.message, "field-error");
    }
  }

  function animateSkillBars() {
    $$(".bar-fill").forEach((fill) => {
      requestAnimationFrame(() => {
        fill.style.width = `${Math.min(100, Math.max(0, Number(fill.dataset.fill) || 0))}%`;
      });
    });
  }

  function configureTheme() {
    const button = $("#themeToggle");
    const savedTheme = localStorage.getItem("portfolioTheme");
    if (savedTheme === "light") document.documentElement.dataset.theme = "light";
    const icon = button?.querySelector(".icon");
    if (icon) icon.textContent = savedTheme === "light" ? "☀" : "☾";
    button?.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      if (nextTheme === "light") document.documentElement.dataset.theme = "light";
      else document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("portfolioTheme", nextTheme);
      if (icon) icon.textContent = nextTheme === "light" ? "☀" : "☾";
    });
  }

  function configureNavigation() {
    const toggle = $("#menuToggle");
    const links = $("#navLinks");
    if (!toggle || !links) return;
    const close = () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
    };
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      links.classList.toggle("open", open);
    });
    links.addEventListener("click", (event) => {
      if (event.target.closest("a")) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
    $("#ctaContact")?.addEventListener("click", () => $("#contact")?.scrollIntoView({ behavior: "smooth" }));
  }

  function validateForm(form, fields) {
    let valid = true;
    fields.forEach(({ id, min = 1, pattern }) => {
      const field = document.getElementById(id);
      const error = $(`[data-error-for="${id}"]`);
      field.value = field.value.trim();
      let message = "";
      if (field.required && field.value.length < min) message = `Please enter at least ${min} characters.`;
      else if (field.type === "email" && !field.validity.valid) message = "Enter a valid email address.";
      else if (pattern && field.value && !pattern.test(field.value)) message = "Enter a valid phone number.";
      if (error) error.textContent = message;
      field.setAttribute("aria-invalid", String(Boolean(message)));
      if (message) valid = false;
    });
    return valid;
  }

  function bindSubmission(formId, endpoint, fields, statusId, messageForSuccess) {
    const form = document.getElementById(formId);
    if (!form) return;
    const status = document.getElementById(statusId);
    form.addEventListener("reset", () => {
      setTimeout(() => {
        $$("[data-error-for]", form).forEach((error) => { error.textContent = ""; });
        $$("[aria-invalid]", form).forEach((field) => field.removeAttribute("aria-invalid"));
      }, 0);
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateForm(form, fields)) {
        showMessage(status, "Please correct the highlighted fields.", "field-error");
        return;
      }
      const button = $('button[type="submit"]', form);
      const originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = "Sending…";
      form.setAttribute("aria-busy", "true");
      try {
        const values = Object.fromEntries(new FormData(form).entries());
        const response = await api.post(endpoint, values);
        showMessage(status, response.message || messageForSuccess, "success-message");
        form.reset();
      } catch (error) {
        showMessage(status, error.message, "field-error");
      } finally {
        button.disabled = false;
        button.textContent = originalLabel;
        form.removeAttribute("aria-busy");
      }
    });
  }

  function configureResumeAndCopy() {
    $("#copyEmailBtn")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      const email = button.dataset.email || $(".contact-details a[href^='mailto:']")?.textContent;
      if (!email) return;
      try {
        await navigator.clipboard.writeText(email);
        showMessage($("#copyEmailStatus"), "Email address copied.", "success-message");
      } catch {
        showMessage($("#copyEmailStatus"), "Clipboard access is unavailable in this browser.");
      }
    });
  }

  function configureScrollTop() {
    const button = make("button", "scroll-top", "↑");
    button.type = "button";
    button.setAttribute("aria-label", "Scroll to top");
    document.body.append(button);
    button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    window.addEventListener("scroll", () => button.classList.toggle("show", window.scrollY > 450), { passive: true });
  }

  configureTheme();
  configureNavigation();
  configureResumeAndCopy();
  configureScrollTop();
  bindSubmission("contactForm", "/submissions/contact", [
    { id: "cFullName", min: 2 },
    { id: "cEmail" },
    { id: "cPhone", min: 7, pattern: /^[+()\d\s.-]{7,40}$/ },
    { id: "cMessage", min: 10 }
  ], "contactStatus", "Your message has been sent.");
  bindSubmission("feedbackForm", "/submissions/feedback", [
    { id: "fbName", min: 2 },
    { id: "fbSubject", min: 3 },
    { id: "fbMessage", min: 10 }
  ], "feedbackStatus", "Thank you for your feedback.");

  loadPortfolio();
  loadProjects();
})();

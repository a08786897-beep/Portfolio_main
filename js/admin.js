(function () {
  const api = window.PortfolioAPI;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const resources = {
    projects: {
      label: "project",
      fields: [
        ["title", "Title", "text", true],
        ["description", "Description", "textarea", true],
        ["technologies", "Technologies (comma separated)", "text", false],
        ["image", "Image URL", "url", false],
        ["githubUrl", "GitHub URL", "url", false],
        ["liveDemoUrl", "Live demo URL", "url", false],
        ["category", "Category", "text", false],
        ["order", "Display order", "number", false]
      ]
    },
    skills: {
      label: "skill",
      fields: [
        ["name", "Name", "text", true],
        ["category", "Category", "text", false],
        ["percentage", "Percentage", "number", false],
        ["order", "Display order", "number", false]
      ]
    },
    experience: {
      label: "experience",
      fields: [
        ["title", "Role / title", "text", true],
        ["company", "Organization", "text", true],
        ["location", "Location", "text", false],
        ["startDate", "Start date", "text", false],
        ["endDate", "End date", "text", false],
        ["current", "Current role", "checkbox", false],
        ["description", "Description", "textarea", false],
        ["order", "Display order", "number", false]
      ]
    },
    education: {
      label: "education record",
      fields: [
        ["degree", "Degree", "text", true],
        ["institution", "Institution", "text", false],
        ["startDate", "Start date", "text", false],
        ["endDate", "End date", "text", false],
        ["current", "Currently studying", "checkbox", false],
        ["description", "Description", "textarea", false],
        ["order", "Display order", "number", false]
      ]
    },
    services: {
      label: "service",
      fields: [
        ["title", "Title", "text", true],
        ["description", "Description", "textarea", true],
        ["order", "Display order", "number", false]
      ]
    }
  };

  function node(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  }

  function status(target, message, isError = false) {
    target.replaceChildren(node("p", isError ? "field-error" : "success-message", message));
  }

  function createField(field, value) {
    const [name, labelText, type, required] = field;
    const label = node("label", "form-row");
    const labelElement = node("span", "label", labelText);
    label.append(labelElement);
    if (type === "checkbox") {
      const checkboxLabel = node("span", "admin-check-row");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = name;
      input.checked = Boolean(value);
      checkboxLabel.append(input, node("span", "", "Yes"));
      label.append(checkboxLabel);
      return label;
    }
    const input = document.createElement(type === "textarea" ? "textarea" : "input");
    input.className = type === "textarea" ? "textarea" : "input";
    input.name = name;
    input.type = type === "textarea" ? undefined : type;
    if (type === "number") {
      input.min = "0";
      input.max = name === "percentage" ? "100" : "100000";
      input.step = "1";
    }
    input.required = required;
    input.maxLength = name === "description" ? 2000 : 500;
    input.value = Array.isArray(value) ? value.join(", ") : (value ?? "");
    label.append(input);
    return label;
  }

  function createEditor(resourceName, manager) {
    const config = resources[resourceName];
    const panel = node("div", "admin-manager-grid");
    const formCard = node("div", "glass-card admin-form-card");
    const form = document.createElement("form");
    form.className = "form";
    form.dataset.resourceForm = resourceName;
    const notice = node("div", "form-status");
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    const heading = node("h3", "card-title", `Add ${config.label}`);
    const fields = node("div", "admin-fields");
    config.fields.forEach((field) => fields.append(createField(field, "")));
    const actions = node("div", "form-actions");
    const submit = node("button", "btn btn-primary", "Save");
    submit.type = "submit";
    const cancel = node("button", "btn btn-ghost", "Cancel edit");
    cancel.type = "button";
    cancel.hidden = true;
    cancel.dataset.cancelEdit = "";
    actions.append(submit, cancel);
    form.append(notice, heading, fields, actions);
    formCard.append(form);

    const records = node("div", "admin-records");
    records.dataset.records = resourceName;
    panel.append(formCard, records);
    manager.append(panel);
    return { form, heading, fields, notice, submit, cancel, records };
  }

  function getPayload(form, fields) {
    const data = Object.fromEntries(new FormData(form).entries());
    fields.forEach(([name, , type]) => {
      const control = form.elements.namedItem(name);
      if (type === "checkbox") data[name] = control.checked;
      else if (type === "number") data[name] = data[name] === "" ? undefined : Number(data[name]);
      else if (name === "technologies") {
        data[name] = String(data[name] || "").split(",").map((value) => value.trim()).filter(Boolean);
      }
    });
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined || data[key] === "") delete data[key];
    });
    return data;
  }

  function renderRecords(records, recordsElement, config, actions = true) {
    recordsElement.replaceChildren();
    if (!records.length) {
      recordsElement.append(node("p", "muted", "No records yet."));
      return;
    }
    records.forEach((record) => {
      const card = node("article", "glass-card admin-record");
      const titleField = config.fields.find(([name]) => ["title", "name", "degree"].includes(name));
      card.append(node("h3", "card-title", record[titleField?.[0]] || config.label));
      const summary = config.fields
        .filter(([name]) => !["title", "name", "degree", "order", "current"].includes(name))
        .map(([name]) => {
          const value = record[name];
          if (Array.isArray(value)) return value.join(", ");
          return value ? String(value) : "";
        })
        .filter(Boolean)
        .join(" • ");
      if (summary) card.append(node("p", "muted", summary));
      if (actions) {
        const buttons = node("div", "form-actions");
        const edit = node("button", "btn btn-soft", "Edit");
        edit.type = "button";
        edit.dataset.editRecord = record._id;
        const remove = node("button", "btn btn-ghost", "Delete");
        remove.type = "button";
        remove.dataset.deleteRecord = record._id;
        buttons.append(edit, remove);
        card.append(buttons);
      }
      recordsElement.append(card);
    });
  }

  async function loadResource(resourceName, editor) {
    const config = resources[resourceName];
    try {
      const response = await api.get(`/admin/${resourceName}`);
      renderRecords(response.data, editor.records, config);
      editor.records.dataset.loaded = "true";
      editor.records._records = response.data;
    } catch (error) {
      status(editor.records, error.message, true);
    }
  }

  function configureResource(resourceName, manager) {
    const editor = createEditor(resourceName, manager);
    const config = resources[resourceName];
    const endpoint = `/admin/${resourceName}`;
    editor.form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!editor.form.reportValidity()) return;
      const id = editor.form.dataset.editId;
      const buttonLabel = editor.submit.textContent;
      editor.submit.disabled = true;
      editor.submit.textContent = "Saving…";
      try {
        const payload = getPayload(editor.form, config.fields);
        await (id ? api.put(`${endpoint}/${id}`, payload) : api.post(endpoint, payload));
        status(editor.notice, `${config.label[0].toUpperCase()}${config.label.slice(1)} saved.`);
        editor.form.reset();
        delete editor.form.dataset.editId;
        editor.heading.textContent = `Add ${config.label}`;
        editor.submit.textContent = "Save";
        editor.cancel.hidden = true;
        await loadResource(resourceName, editor);
      } catch (error) {
        status(editor.notice, error.message, true);
      } finally {
        editor.submit.disabled = false;
        if (editor.submit.textContent === "Saving…") editor.submit.textContent = buttonLabel;
      }
    });

    editor.cancel.addEventListener("click", () => {
      editor.form.reset();
      delete editor.form.dataset.editId;
      editor.heading.textContent = `Add ${config.label}`;
      editor.submit.textContent = "Save";
      editor.cancel.hidden = true;
      editor.notice.replaceChildren();
    });

    editor.records.addEventListener("click", async (event) => {
      const editButton = event.target.closest("[data-edit-record]");
      const deleteButton = event.target.closest("[data-delete-record]");
      if (editButton) {
        const record = editor.records._records?.find((item) => item._id === editButton.dataset.editRecord);
        if (!record) return;
        editor.form.dataset.editId = record._id;
        config.fields.forEach(([name]) => {
          const control = editor.form.elements.namedItem(name);
          if (control.type === "checkbox") control.checked = Boolean(record[name]);
          else control.value = Array.isArray(record[name]) ? record[name].join(", ") : (record[name] ?? "");
        });
        editor.heading.textContent = `Edit ${config.label}`;
        editor.submit.textContent = "Update";
        editor.cancel.hidden = false;
        editor.form.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (deleteButton && window.confirm(`Delete this ${config.label}?`)) {
        try {
          await api.delete(`${endpoint}/${deleteButton.dataset.deleteRecord}`);
          await loadResource(resourceName, editor);
        } catch (error) {
          status(editor.records, error.message, true);
        }
      }
    });
    return editor;
  }

  async function loadMessages() {
    const list = $("#messagesList");
    list.replaceChildren();
    try {
      const response = await api.get("/admin/messages");
      if (!response.data.length) {
        list.append(node("p", "muted", "No contact messages yet."));
        return;
      }
      response.data.forEach((message) => {
        const card = node("article", "glass-card admin-record");
        card.append(node("h3", "card-title", message.fullName));
        card.append(node("p", "muted", `${message.email}${message.phone ? ` • ${message.phone}` : ""}`));
        card.append(node("p", "", message.message));
        card.append(node("p", "history-meta", `${new Date(message.createdAt).toLocaleString()} • ${message.read ? "Read" : "Unread"}`));
        const actions = node("div", "form-actions");
        if (!message.read) {
          const read = node("button", "btn btn-soft", "Mark as read");
          read.type = "button";
          read.addEventListener("click", async () => {
            try {
              await api.patch(`/admin/messages/${message._id}`, { read: true });
              loadMessages();
            } catch (error) {
              status(list, error.message, true);
            }
          });
          actions.append(read);
        }
        const remove = node("button", "btn btn-ghost", "Delete");
        remove.type = "button";
        remove.addEventListener("click", async () => {
          if (!window.confirm("Delete this contact message?")) return;
          try {
            await api.delete(`/admin/messages/${message._id}`);
            loadMessages();
          } catch (error) {
            status(list, error.message, true);
          }
        });
        actions.append(remove);
        card.append(actions);
        list.append(card);
      });
    } catch (error) {
      status(list, error.message, true);
    }
  }

  async function loadFeedback() {
    const list = $("#feedbackList");
    list.replaceChildren();
    try {
      const response = await api.get("/admin/feedback");
      if (!response.data.length) {
        list.append(node("p", "muted", "No visitor feedback yet."));
        return;
      }
      response.data.forEach((feedback) => {
        const card = node("article", "glass-card admin-record");
        card.append(node("h3", "card-title", feedback.subject));
        card.append(node("p", "muted", `From ${feedback.name} • ${new Date(feedback.createdAt).toLocaleString()}`));
        card.append(node("p", "", feedback.message));
        const remove = node("button", "btn btn-ghost", "Delete");
        remove.type = "button";
        remove.addEventListener("click", async () => {
          if (!window.confirm("Delete this feedback?")) return;
          try {
            await api.delete(`/admin/feedback/${feedback._id}`);
            loadFeedback();
          } catch (error) {
            status(list, error.message, true);
          }
        });
        card.append(remove);
        list.append(card);
      });
    } catch (error) {
      status(list, error.message, true);
    }
  }

  const profileFields = [
    ["name", "Name", "text"],
    ["headline", "Headline", "text"],
    ["subtitle", "Hero subtitle", "textarea"],
    ["about", "About summary", "textarea"],
    ["email", "Email", "email"],
    ["phone", "Phone", "tel"],
    ["location", "Location", "text"],
    ["resumeUrl", "Resume PDF URL", "url"]
  ];

  function setupProfileForm() {
    const fields = $("#profileFields");
    profileFields.forEach(([name, labelText, type]) => {
      const label = node("label", "form-row");
      label.append(node("span", "label", labelText));
      const input = document.createElement(type === "textarea" ? "textarea" : "input");
      input.className = type === "textarea" ? "textarea" : "input";
      input.name = name;
      if (type !== "textarea") input.type = type;
      label.append(input);
      fields.append(label);
    });
  }

  async function loadProfile() {
    const response = await api.get("/admin/profile");
    const profile = response.data || {};
    profileFields.forEach(([name]) => {
      $("#profileForm").elements.namedItem(name).value = profile[name] || "";
    });
  }

  async function loadDashboard() {
    await loadProfile();
    $("#adminLogin").hidden = true;
    $("#adminDashboard").hidden = false;
    $("#adminIdentity").textContent = `Signed in as ${sessionStorage.getItem("portfolioAdminEmail") || "administrator"}`;
    const editors = {};
    Object.keys(resources).forEach((name) => {
      editors[name] = configureResource(name, $(`[data-resource="${name}"]`));
    });
    await Promise.all([
      loadMessages(),
      loadFeedback(),
      ...Object.entries(editors).map(([name, editor]) => loadResource(name, editor))
    ]);
  }

  function setLoginStatus(message, isError) {
    status($("#loginStatus"), message, isError);
  }

  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const button = $('button[type="submit"]', form);
    button.disabled = true;
    button.textContent = "Signing in…";
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const response = await api.post("/auth/login", data);
      sessionStorage.setItem(api.tokenKey, response.data.token);
      sessionStorage.setItem("portfolioAdminEmail", response.data.email);
      setLoginStatus("", false);
      await loadDashboard();
    } catch (error) {
      sessionStorage.removeItem(api.tokenKey);
      sessionStorage.removeItem("portfolioAdminEmail");
      $("#adminDashboard").hidden = true;
      $("#adminLogin").hidden = false;
      setLoginStatus(error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = "Sign in";
    }
  });

  $("#logoutButton").addEventListener("click", async () => {
    try {
      await api.post("/auth/logout", {});
    } catch (error) {
      setLoginStatus(`Local session cleared. ${error.message}`, true);
    } finally {
      sessionStorage.removeItem(api.tokenKey);
      sessionStorage.removeItem("portfolioAdminEmail");
      $("#adminDashboard").hidden = true;
      $("#adminLogin").hidden = false;
    }
  });

  $("#profileForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const button = $('button[type="submit"]', form);
    button.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const response = await api.patch("/admin/profile", data);
      status($("#profileStatus"), "Profile updated.");
      await loadProfile();
    } catch (error) {
      status($("#profileStatus"), error.message, true);
    } finally {
      button.disabled = false;
    }
  });

  $$(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".admin-tab").forEach((item) => {
        const selected = item === tab;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-selected", String(selected));
      });
      $$(".admin-panel").forEach((panel) => {
        const selected = panel.id === `panel-${tab.dataset.tab}`;
        panel.hidden = !selected;
        panel.classList.toggle("active", selected);
      });
    });
  });

  setupProfileForm();
  if (sessionStorage.getItem(api.tokenKey)) {
    loadDashboard().catch((error) => {
      sessionStorage.removeItem(api.tokenKey);
      sessionStorage.removeItem("portfolioAdminEmail");
      setLoginStatus(error.message, true);
    });
  }
})();

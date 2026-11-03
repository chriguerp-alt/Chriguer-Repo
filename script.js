
(() => {
  "use strict";

  const STORAGE = "practical44_web_v06";

  const $ = id => document.getElementById(id);

  const statusNames = {
    active: "Ativo",
    paused: "Pausado",
    completed: "Concluído"
  };

  let data = loadData();

  function loadData() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE));

      if (saved && Array.isArray(saved.projects)) {
        return {
          projects: saved.projects,
          history: Array.isArray(saved.history) ? saved.history : [],
          notes: typeof saved.notes === "string" ? saved.notes : "",
          theme: saved.theme === "dark" ? "dark" : "light"
        };
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }

    return {
      projects: [],
      history: [],
      notes: "",
      theme: "light"
    };
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(data));
    } catch (error) {
      notify("Não foi possível salvar os dados.");
    }
  }

  function uid() {
    return Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8);
  }

  function safe(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function formatDate(date) {
    return new Date(date).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    });
  }

  function notify(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(notify.timer);

    notify.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2600);
  }

  // HISTÓRICO

  function logActivity(message) {
    data.history.unshift({
      id: uid(),
      message,
      date: new Date().toISOString()
    });

    data.history = data.history.slice(0, 500);
    saveData();
  }

  // TEMA

  function applyTheme() {
    document.documentElement.dataset.theme = data.theme;

    $("themeButton").textContent =
      data.theme === "dark"
        ? "☀ Ativar tema claro"
        : "☾ Ativar tema escuro";
  }

  function toggleTheme() {
    data.theme = data.theme === "dark" ? "light" : "dark";

    saveData();
    applyTheme();

    notify("Tema atualizado!");
  }

  // NAVEGAÇÃO

  function navigate(page) {
    document.querySelectorAll(".page").forEach(section => {
      section.classList.toggle("active", section.id === page);
    });

    document.querySelectorAll("[data-page]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page === page
      );
    });

    const titles = {
      dashboard: "Dashboard",
      projects: "Projetos",
      history: "Histórico",
      statistics: "Estatísticas",
      notes: "Anotações",
      settings: "Configurações"
    };

    $("pageTitle").textContent = titles[page] || "Dashboard";

    $("sidebar").classList.remove("open");

    renderAll();
  }

  // DASHBOARD

  function renderDashboard() {
    const projects = data.projects;

    $("totalProjects").textContent = projects.length;

    $("activeProjects").textContent =
      projects.filter(p => p.status === "active").length;

    $("pausedProjects").textContent =
      projects.filter(p => p.status === "paused").length;

    $("totalActivities").textContent = data.history.length;

    const recent = [...projects]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5);

    $("recentProjects").innerHTML = recent.length
      ? recent.map(p => `
        <div class="recent-row">
          <strong>${safe(p.name)}</strong>
          <span class="status ${p.status}">
            ${statusNames[p.status]}
          </span>
        </div>
      `).join("")
      : `<div class="empty">Nenhum projeto cadastrado.</div>`;

    $("recentActivities").innerHTML = data.history
      .slice(0, 5)
      .map(item => `
        <div class="activity-row">
          <div>
            ${safe(item.message)}
            <small>${formatDate(item.date)}</small>
          </div>
        </div>
      `).join("")
      || `<div class="empty">Nenhuma atividade registrada.</div>`;
  }

  // PROJETOS

  function renderProjects() {
    const search = $("searchProjects").value.toLowerCase().trim();
    const filter = $("filterProjects").value;

    const projects = data.projects.filter(p => {
      const matchesSearch =
        (p.name + " " + p.description).toLowerCase().includes(search);

      const matchesStatus =
        filter === "all" || p.status === filter;

      return matchesSearch && matchesStatus;
    });

    $("projectList").innerHTML = projects.length
      ? projects.map(p => `
        <article class="project-card">
          <span class="status ${p.status}">
            ${statusNames[p.status]}
          </span>

          <h3>${safe(p.name)}</h3>

          <p>${safe(p.description || "Sem descrição.")}</p>

          <div class="project-meta">
            Criado em ${new Date(p.createdAt).toLocaleDateString("pt-BR")}
          </div>

          <div class="card-actions">
            <button class="small-button"
              data-action="edit" data-id="${p.id}">
              Editar
            </button>

            <button class="small-button"
              data-action="toggle" data-id="${p.id}">
              ${p.status === "paused" ? "Ativar" :
                p.status === "completed" ? "Reabrir" : "Pausar"}
            </button>

            <button class="small-button delete"
              data-action="delete" data-id="${p.id}">
              Excluir
            </button>
          </div>
        </article>
      `).join("")
      : `<div class="empty">Nenhum projeto encontrado.</div>`;
  }

  function openModal(project = null) {
    $("projectForm").reset();

    $("editId").value = project ? project.id : "";

    $("modalTitle").textContent =
      project ? "Editar projeto" : "Novo projeto";

    $("projectName").value = project?.name || "";
    $("projectDescription").value = project?.description || "";
    $("projectStatus").value = project?.status || "active";

    $("projectModal").showModal();
  }

  function saveProject(event) {
    event.preventDefault();

    const id = $("editId").value;
    const name = $("projectName").value.trim();

    if (!name) return;

    const now = new Date().toISOString();

    if (id) {
      const project = data.projects.find(p => p.id === id);

      if (!project) return;

      Object.assign(project, {
        name,
        description: $("projectDescription").value.trim(),
        status: $("projectStatus").value,
        updatedAt: now
      });

      logActivity(`Projeto "${name}" atualizado.`);

    } else {
      data.projects.push({
        id: uid(),
        name,
        description: $("projectDescription").value.trim(),
        status: $("projectStatus").value,
        createdAt: now,
        updatedAt: now
      });

      logActivity(`Projeto "${name}" criado.`);
    }

    saveData();
    $("projectModal").close();

    renderAll();
    notify("Projeto salvo!");
  }

  function projectAction(action, id) {
    const project = data.projects.find(p => p.id === id);

    if (!project) return;

    if (action === "edit") {
      openModal(project);
      return;
    }

    if (action === "delete") {
      if (!confirm(`Excluir "${project.name}"?`)) return;

      data.projects = data.projects.filter(p => p.id !== id);

      logActivity(`Projeto "${project.name}" excluído.`);
    }

    if (action === "toggle") {
      if (project.status === "paused") {
        project.status = "active";
      } else if (project.status === "active") {
        project.status = "paused";
      } else {
        project.status = "active";
      }

      project.updatedAt = new Date().toISOString();

      logActivity(
        `"${project.name}" agora está ${statusNames[project.status].toLowerCase()}.`
      );
    }

    saveData();
    renderAll();
    notify("Projeto atualizado!");
  }

  // HISTÓRICO

  function renderHistory() {
    $("historyList").innerHTML = data.history.length
      ? data.history.map(item => `
        <div class="history-row">
          ${safe(item.message)}
          <small>${formatDate(item.date)}</small>
        </div>
      `).join("")
      : `<div class="empty">Seu histórico está vazio.</div>`;
  }

  // ESTATÍSTICAS

  function renderStatistics() {
    const projects = data.projects;

    const completed =
      projects.filter(p => p.status === "completed").length;

    const active =
      projects.filter(p => p.status === "active").length;

    const paused =
      projects.filter(p => p.status === "paused").length;

    const total = projects.length;

    const rate = total
      ? Math.round(completed / total * 100)
      : 0;

    const month = new Date().toISOString().slice(0, 7);

    const monthly = projects.filter(p =>
      p.createdAt.startsWith(month)
    ).length;

    $("completedCount").textContent = completed;
    $("completionRate").textContent = rate + "%";
    $("monthlyCount").textContent = monthly;
    $("notesCount").textContent =
      data.notes.length.toLocaleString("pt-BR");

    const counts = {
      active,
      paused,
      completed
    };

    const maximum = Math.max(total, 1);

    $("statisticsBars").innerHTML =
      Object.entries(counts).map(([status, count]) => `
        <div class="bar-item">
          <div class="bar-label">
            <span>${statusNames[status]}</span>
            <strong>${count}</strong>
          </div>

          <div class="bar-track">
            <div class="bar-fill"
              style="width:${count / maximum * 100}%">
            </div>
          </div>
        </div>
      `).join("");

    $("statisticsSummary").innerHTML = `
      <div class="summary-row">
        <span>Total de projetos</span><strong>${total}</strong>
      </div>
      <div class="summary-row">
        <span>Projetos ativos</span><strong>${active}</strong>
      </div>
      <div class="summary-row">
        <span>Projetos pausados</span><strong>${paused}</strong>
      </div>
      <div class="summary-row">
        <span>Projetos concluídos</span><strong>${completed}</strong>
      </div>
      <div class="summary-row">
        <span>Atividades</span><strong>${data.history.length}</strong>
      </div>
    `;
  }

  // ANOTAÇÕES

  function renderNotes() {
    $("notesArea").value = data.notes;

    $("characterCount").textContent =
      data.notes.length.toLocaleString("pt-BR") + " caracteres";
  }

  // BACKUPS

  function downloadJSON(filename, object) {
    const blob = new Blob(
      [JSON.stringify(object, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function readJSON(file) {
    if (!file) return null;

    try {
      return JSON.parse(await file.text());
    } catch {
      notify("Arquivo JSON inválido.");
      return null;
    }
  }

  function validProject(p) {
    return p &&
      typeof p.name === "string" &&
      ["active", "paused", "completed"].includes(p.status);
  }

  // EVENTOS

  function bindEvents() {

    document.querySelectorAll("[data-page]").forEach(button => {
      button.addEventListener("click", () => {
        navigate(button.dataset.page);
      });
    });

    $("themeButton").addEventListener("click", toggleTheme);
    $("settingsTheme").addEventListener("click", toggleTheme);

    $("menuButton").addEventListener("click", () => {
      $("sidebar").classList.toggle("open");
    });

    $("addProject").addEventListener("click", () => openModal());
    $("quickAdd").addEventListener("click", () => openModal());

    $("closeModal").addEventListener("click", () => {
      $("projectModal").close();
    });

    $("cancelModal").addEventListener("click", () => {
      $("projectModal").close();
    });

    $("projectForm").addEventListener("submit", saveProject);

    $("searchProjects").addEventListener("input", renderProjects);
    $("filterProjects").addEventListener("change", renderProjects);

    $("projectList").addEventListener("click", event => {
      const button = event.target.closest("[data-action]");

      if (button) {
        projectAction(button.dataset.action, button.dataset.id);
      }
    });

    $("clearHistory").addEventListener("click", () => {
      if (!confirm("Limpar todo o histórico?")) return;

      data.history = [];
      saveData();
      renderAll();
      notify("Histórico limpo.");
    });

    $("notesArea").addEventListener("input", () => {
      data.notes = $("notesArea").value;
      saveData();

      $("characterCount").textContent =
        data.notes.length.toLocaleString("pt-BR") + " caracteres";

      $("saveStatus").textContent = "Salvo";
    });

    // BACKUP COMPLETO

    $("exportBackup").addEventListener("click", () => {
      downloadJSON("practical44-backup.json", {
        app: "Practical 44",
        version: "0.6",
        exportedAt: new Date().toISOString(),
        ...data
      });

      notify("Backup exportado!");
    });

    $("importBackup").addEventListener("change", async event => {
      const file = event.target.files[0];
      event.target.value = "";

      const backup = await readJSON(file);

      if (!backup) return;

      if (
        !Array.isArray(backup.projects) ||
        !Array.isArray(backup.history) ||
        typeof backup.notes !== "string"
      ) {
        notify("Backup incompatível.");
        return;
      }

      if (!confirm("Restaurar backup? Os dados atuais serão substituídos.")) {
        return;
      }

      data = {
        projects: backup.projects.filter(validProject),
        history: backup.history,
        notes: backup.notes,
        theme: backup.theme === "dark" ? "dark" : "light"
      };

      saveData();
      applyTheme();
      renderAll();
      renderNotes();

      notify("Backup restaurado!");
    });

    // EXPORTAR PROJETOS

    $("exportProjects").addEventListener("click", () => {
      downloadJSON("practical44-projetos.json", {
        projects: data.projects
      });

      notify("Projetos exportados!");
    });

    // IMPORTAR PROJETOS

    $("importProjects").addEventListener("change", async event => {
      const file = event.target.files[0];
      event.target.value = "";

      const object = await readJSON(file);

      if (!object) return;

      const projects = Array.isArray(object)
        ? object
        : object.projects;

      if (!Array.isArray(projects)) {
        notify("Lista de projetos inválida.");
        return;
      }

      const valid = projects.filter(validProject);

      if (!valid.length) {
        notify("Nenhum projeto válido encontrado.");
        return;
      }

      if (!confirm(`Importar ${valid.length} projeto(s)?`)) {
        return;
      }

      const now = new Date().toISOString();

      valid.forEach(p => {
        data.projects.push({
          ...p,
          id: uid(),
          createdAt: p.createdAt || now,
          updatedAt: now,
          description: p.description || ""
        });
      });

      logActivity(`${valid.length} projeto(s) importados.`);

      saveData();
      renderAll();

      notify("Importação concluída!");
    });

    // RESET

    $("resetData").addEventListener("click", () => {
      if (!confirm(
        "ATENÇÃO: apagar todos os projetos, histórico e anotações?"
      )) return;

      localStorage.removeItem(STORAGE);

      data = {
        projects: [],
        history: [],
        notes: "",
        theme: "light"
      };

      applyTheme();
      renderAll();
      renderNotes();

      notify("Dados apagados.");
    });
  }

  // ATUALIZAÇÃO GERAL

  function renderAll() {
    renderDashboard();
    renderProjects();
    renderHistory();
    renderStatistics();
  }

  // INICIALIZAÇÃO

  applyTheme();
  bindEvents();
  renderAll();
  renderNotes();

})();

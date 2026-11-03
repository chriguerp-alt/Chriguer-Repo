
/* ==========================================
   PRACTICAL 44 - WEB EDITION 0.7
   HTML + CSS + JavaScript + LocalStorage
========================================== */

const STORAGE_KEY = "practical44_v07";

const $ = (selector) => document.querySelector(selector);

const defaultData = {
  projects: [],
  tasks: [],
  tags: [
    { id: "tech", name: "Tecnologia", color: "#3985ee" },
    { id: "study", name: "Estudos", color: "#e5a52c" },
    { id: "personal", name: "Pessoal", color: "#21a675" }
  ],
  trash: [],
  history: [],
  notes: "",
  events: [],
  settings: {
    theme: "light",
    accent: "#2563eb",
    density: "normal",
    sidebar: "expanded",
    animations: true,
    panelName: "Practical 44"
  }
};

let data = loadData();
let currentPage = "dashboard";
let editing = null;
let calendarDate = new Date();
let selectedColor = "#3985ee";

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultData, ...JSON.parse(saved) };
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }

  return structuredClone(defaultData);
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function id() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    element.classList.remove("show");
  }, 2500);
}

function log(message) {
  data.history.unshift({
    id: id(),
    message,
    date: new Date().toISOString()
  });

  data.history = data.history.slice(0, 300);
  saveData();
}

function formatDate(value) {
  if (!value) return "Sem data";

  return new Date(value + "T12:00:00").toLocaleDateString("pt-BR");
}

function getProject(projectId) {
  return data.projects.find(project => project.id === projectId);
}

function getTag(tagId) {
  return data.tags.find(tag => tag.id === tagId);
}

function tagHTML(tagId) {
  const tag = getTag(tagId);
  if (!tag) return "";

  return `<span class="tag" style="background:${tag.color}22;color:${tag.color}">
    ${escapeHTML(tag.name)}
  </span>`;
}

function projectProgress(projectId) {
  const tasks = data.tasks.filter(task => task.projectId === projectId);
  if (!tasks.length) return 0;

  return Math.round(
    tasks.filter(task => task.done).length / tasks.length * 100
  );
}

function activeTasks() {
  return data.tasks.filter(task => !task.done);
}

function overdueTasks() {
  const today = new Date().toISOString().slice(0, 10);
  return activeTasks().filter(task => task.due && task.due < today);
}

function applySettings() {
  document.body.classList.toggle("dark", data.settings.theme === "dark");
  document.body.classList.toggle("compact", data.settings.density === "compact");
  document.body.classList.toggle("comfortable", data.settings.density === "comfortable");

  document.documentElement.style.setProperty("--primary", data.settings.accent);
  document.documentElement.style.setProperty(
    "--primary-soft", data.settings.accent + "20"
  );

  document.title = (data.settings.panelName || "Practical 44") + " | 0.7";
}

function navigate(page) {
  currentPage = page;

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const titles = {
    dashboard: "Dashboard",
    projects: "Projetos",
    tasks: "Tarefas",
    calendar: "Calendário",
    history: "Histórico",
    statistics: "Estatísticas",
    tags: "Etiquetas",
    notes: "Anotações",
    trash: "Lixeira",
    appearance: "Personalização",
    settings: "Configurações"
  };

  $("#pageTitle").textContent = titles[page] || "Practical 44";
  $("#sidebar").classList.remove("open");

  render();
}

function render() {
  const pages = {
    dashboard: renderDashboard,
    projects: renderProjects,
    tasks: renderTasks,
    calendar: renderCalendar,
    history: renderHistory,
    statistics: renderStatistics,
    tags: renderTags,
    notes: renderNotes,
    trash: renderTrash,
    appearance: renderAppearance,
    settings: renderSettings
  };

  (pages[currentPage] || renderDashboard)();
}

function emptyState(title, description) {
  return `<div class="empty-state">
    <strong>${escapeHTML(title)}</strong>
    ${escapeHTML(description)}
  </div>`;
}

function renderDashboard() {
  const active = data.projects.filter(p => p.status === "active");
  const paused = data.projects.filter(p => p.status === "paused");
  const completed = data.tasks.filter(t => t.done);

  $("#pageContent").innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Visão geral</h2>
        <p>Acompanhe seus projetos e sua produtividade.</p>
      </div>
      <button class="primary" onclick="openProjectModal()">+ Novo projeto</button>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><span>Total de projetos</span><strong>${data.projects.length}</strong></div>
      <div class="stat-card"><span>Projetos ativos</span><strong>${active.length}</strong></div>
      <div class="stat-card"><span>Tarefas pendentes</span><strong>${activeTasks().length}</strong></div>
      <div class="stat-card"><span>Tarefas concluídas</span><strong>${completed.length}</strong></div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><span>Projetos pausados</span><strong>${paused.length}</strong></div>
      <div class="stat-card"><span>Tarefas atrasadas</span><strong>${overdueTasks().length}</strong></div>
      <div class="stat-card"><span>Etiquetas</span><strong>${data.tags.length}</strong></div>
      <div class="stat-card"><span>Atividades registradas</span><strong>${data.history.length}</strong></div>
    </div>

    <div class="content-grid">
      <div class="panel">
        <h3>Projetos recentes</h3>
        ${data.projects.length
          ? [...data.projects].slice(-5).reverse().map(project => `
            <div class="list-row">
              <div>
                <strong>${escapeHTML(project.name)}</strong>
                <small>${projectProgress(project.id)}% concluído</small>
              </div>
              <span class="pill ${project.status}">
                ${project.status === "paused" ? "Pausado" : "Ativo"}
              </span>
            </div>
          `).join("")
          : emptyState("Nenhum projeto ainda", "Crie seu primeiro projeto para começar.")}
      </div>

      <div class="panel">
        <h3>Atividades recentes</h3>
        ${data.history.length
          ? data.history.slice(0, 6).map(item => `
            <div class="list-row">
              <div>
                ${escapeHTML(item.message)}
                <small>${new Date(item.date).toLocaleString("pt-BR")}</small>
              </div>
            </div>
          `).join("")
          : emptyState("Sem atividades", "Suas ações aparecerão aqui.")}
      </div>
    </div>

    <div class="panel" style="margin-top:18px">
      <h3>Tarefas próximas do prazo</h3>
      ${data.tasks.filter(t => !t.done && t.due).sort((a,b) => a.due.localeCompare(b.due)).slice(0,5).map(task => `
        <div class="list-row">
          <div>
            <strong>${escapeHTML(task.title)}</strong>
            <small>${escapeHTML(getProject(task.projectId)?.name || "Sem projeto")} · ${formatDate(task.due)}</small>
          </div>
          <span class="pill">${escapeHTML(task.priority)}</span>
        </div>
      `).join("") || emptyState("Tudo tranquilo!", "Nenhuma tarefa com prazo pendente.")}
    </div>
  `;
}

function renderProjects() {
  $("#pageContent").innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Seus projetos</h2>
        <p>Organize suas ideias e acompanhe o progresso.</p>
      </div>
      <button class="primary" onclick="openProjectModal()">+ Novo projeto</button>
    </div>

    <div class="toolbar">
      <input class="search-input" id="projectSearch" placeholder="Pesquisar projetos...">
      <select class="search-input" id="projectFilter">
        <option value="all">Todos os projetos</option>
        <option value="active">Ativos</option>
        <option value="paused">Pausados</option>
      </select>
      <select class="search-input" id="projectTagFilter">
        <option value="all">Todas as etiquetas</option>
        ${data.tags.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join("")}
      </select>
    </div>

    <div class="project-grid" id="projectGrid"></div>
  `;

  const update = () => {
    const query = $("#projectSearch").value.toLowerCase();
    const filter = $("#projectFilter").value;
    const tagFilter = $("#projectTagFilter").value;

    const projects = data.projects.filter(project => {
      const matchesName = project.name.toLowerCase().includes(query);
      const matchesStatus = filter === "all" || project.status === filter;
      const matchesTag = tagFilter === "all" || (project.tags || []).includes(tagFilter);
      return matchesName && matchesStatus && matchesTag;
    });

    $("#projectGrid").innerHTML = projects.length
      ? projects.map(project => projectCard(project)).join("")
      : emptyState("Nenhum projeto encontrado", "Tente mudar os filtros ou crie um projeto.");
  };

  $("#projectSearch").addEventListener("input", update);
  $("#projectFilter").addEventListener("change", update);
  $("#projectTagFilter").addEventListener("change", update);
  update();
}

function projectCard(project) {
  const progress = projectProgress(project.id);

  return `
    <article class="project-card">
      <div class="card-top">
        <div class="card-title">${escapeHTML(project.name)}</div>
        <span class="pill ${project.status}">
          ${project.status === "paused" ? "Pausado" : "Ativo"}
        </span>
      </div>

      <p class="card-description">${escapeHTML(project.description || "Sem descrição.")}</p>
      ${(project.tags || []).map(tagHTML).join("")}

      <div class="progress-track">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>
      <small class="muted">${progress}% concluído · ${data.tasks.filter(t => t.projectId === project.id).length} tarefas</small>

      <div class="card-actions">
        <button class="small-button" onclick="openTaskModal('${project.id}')">+ Tarefa</button>
        <button class="small-button" onclick="editProject('${project.id}')">Editar</button>
        <button class="small-button" onclick="toggleProject('${project.id}')">${project.status === "active" ? "Pausar" : "Ativar"}</button>
        <button class="small-button" onclick="moveToTrash('project','${project.id}')">Excluir</button>
      </div>
    </article>
  `;
}

function openProjectModal(project = null) {
  editing = project ? { type: "project", id: project.id } : null;

  showModal(project ? "Editar projeto" : "Novo projeto", `
    <div class="form-field">
      <label>Nome do projeto</label>
      <input name="name" required maxlength="60" value="${escapeHTML(project?.name || "")}">
    </div>
    <div class="form-field">
      <label>Descrição</label>
      <textarea name="description">${escapeHTML(project?.description || "")}</textarea>
    </div>
    <div class="form-field">
      <label>Situação</label>
      <select name="status">
        <option value="active" ${project?.status !== "paused" ? "selected" : ""}>Ativo</option>
        <option value="paused" ${project?.status === "paused" ? "selected" : ""}>Pausado</option>
      </select>
    </div>
    <div class="form-field">
      <label>Etiquetas</label>
      <select name="tags" multiple size="4">
        ${data.tags.map(tag => `
          <option value="${tag.id}" ${(project?.tags || []).includes(tag.id) ? "selected" : ""}>
            ${escapeHTML(tag.name)}
          </option>
        `).join("")}
      </select>
      <small class="muted">Use Ctrl para selecionar várias etiquetas.</small>
    </div>
  `, values => {
    const selectedTags = [...$("#modalFields [name=tags]").selectedOptions].map(o => o.value);

    if (editing) {
      Object.assign(project, values, { tags: selectedTags });
      log(`Projeto "${project.name}" atualizado.`);
    } else {
      data.projects.push({
        id: id(),
        ...values,
        tags: selectedTags,
        created: new Date().toISOString()
      });
      log(`Projeto "${values.name}" criado.`);
    }

    saveData();
    closeModal();
    render();
    toast("Projeto salvo!");
  });
}

function editProject(projectId) {
  const project = getProject(projectId);
  if (project) openProjectModal(project);
}

function toggleProject(projectId) {
  const project = getProject(projectId);
  if (!project) return;

  project.status = project.status === "active" ? "paused" : "active";
  log(`Projeto "${project.name}" ${project.status === "active" ? "ativado" : "pausado"}.`);
  saveData();
  render();
  toast("Situação atualizada!");
}

function renderTasks() {
  $("#pageContent").innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Central de tarefas</h2>
        <p>Veja todas as tarefas de todos os seus projetos.</p>
      </div>
      <button class="primary" onclick="openTaskModal()">+ Nova tarefa</button>
    </div>

    <div class="toolbar">
      <input class="search-input" id="taskSearch" placeholder="Pesquisar tarefas...">
      <select class="search-input" id="taskFilter">
        <option value="all">Todas</option>
        <option value="pending">Pendentes</option>
        <option value="done">Concluídas</option>
        <option value="overdue">Atrasadas</option>
      </select>
      <select class="search-input" id="taskPriority">
        <option value="all">Todas as prioridades</option>
        <option value="Alta">Alta</option>
        <option value="Média">Média</option>
        <option value="Baixa">Baixa</option>
      </select>
    </div>
    <div class="task-grid" id="taskGrid"></div>
  `;

  const update = () => {
    const query = $("#taskSearch").value.toLowerCase();
    const filter = $("#taskFilter").value;
    const priority = $("#taskPriority").value;
    const today = new Date().toISOString().slice(0, 10);

    const tasks = data.tasks.filter(task => {
      const matchesText = task.title.toLowerCase().includes(query);
      const matchesFilter =
        filter === "all" ||
        (filter === "done" && task.done) ||
        (filter === "pending" && !task.done) ||
        (filter === "overdue" && !task.done && task.due && task.due < today);
      const matchesPriority = priority === "all" || task.priority === priority;

      return matchesText && matchesFilter && matchesPriority;
    });

    $("#taskGrid").innerHTML = tasks.length
      ? tasks.map(taskCard).join("")
      : emptyState("Nenhuma tarefa encontrada", "Crie uma tarefa ou altere os filtros.");
  };

  $("#taskSearch").addEventListener("input", update);
  $("#taskFilter").addEventListener("change", update);
  $("#taskPriority").addEventListener("change", update);
  update();
}

function taskCard(task) {
  const project = getProject(task.projectId);

  return `
    <article class="task-card">
      <input type="checkbox" ${task.done ? "checked" : ""}
        onchange="toggleTask('${task.id}')">
      <div class="task-content ${task.done ? "done" : ""}">
        <div class="card-title">${escapeHTML(task.title)}</div>
        <p class="card-description">
          ${escapeHTML(project?.name || "Sem projeto")}
          · ${task.due ? formatDate(task.due) : "Sem prazo"}
        </p>
        <span class="pill">${escapeHTML(task.priority)}</span>
        ${tagHTML(task.tagId)}
        <div class="card-actions">
          <button class="small-button" onclick="editTask('${task.id}')">Editar</button>
          <button class="small-button" onclick="moveToTrash('task','${task.id}')">Excluir</button>
        </div>
      </div>
    </article>
  `;
}

function openTaskModal(projectId = "", task = null) {
  editing = task ? { type: "task", id: task.id } : null;

  showModal(task ? "Editar tarefa" : "Nova tarefa", `
    <div class="form-field">
      <label>Nome da tarefa</label>
      <input name="title" required maxlength="100" value="${escapeHTML(task?.title || "")}">
    </div>
    <div class="form-field">
      <label>Projeto</label>
      <select name="projectId">
        <option value="">Sem projeto</option>
        ${data.projects.map(project => `
          <option value="${project.id}" ${(task?.projectId || projectId) === project.id ? "selected" : ""}>
            ${escapeHTML(project.name)}
          </option>
        `).join("")}
      </select>
    </div>
    <div class="form-field">
      <label>Descrição</label>
      <textarea name="description">${escapeHTML(task?.description || "")}</textarea>
    </div>
    <div class="form-field">
      <label>Prioridade</label>
      <select name="priority">
        ${["Baixa","Média","Alta"].map(p => `<option ${task?.priority === p || (!task && p === "Média") ? "selected" : ""}>${p}</option>`).join("")}
      </select>
    </div>
    <div class="form-field">
      <label>Data de vencimento</label>
      <input type="date" name="due" value="${task?.due || ""}">
    </div>
    <div class="form-field">
      <label>Etiqueta</label>
      <select name="tagId">
        <option value="">Nenhuma</option>
        ${data.tags.map(tag => `<option value="${tag.id}" ${task?.tagId === tag.id ? "selected" : ""}>${escapeHTML(tag.name)}</option>`).join("")}
      </select>
    </div>
  `, values => {
    if (editing) {
      Object.assign(task, values);
      log(`Tarefa "${task.title}" atualizada.`);
    } else {
      data.tasks.push({
        id: id(),
        ...values,
        done: false,
        created: new Date().toISOString()
      });
      log(`Tarefa "${values.title}" criada.`);
    }

    saveData();
    closeModal();
    render();
    toast("Tarefa salva!");
  });
}

function editTask(taskId) {
  const task = data.tasks.find(t => t.id === taskId);
  if (task) openTaskModal("", task);
}

function toggleTask(taskId) {
  const task = data.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.done = !task.done;
  log(`Tarefa "${task.title}" ${task.done ? "concluída" : "reaberta"}.`);
  saveData();
  render();
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousDays = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  let cells = "";

  for (let i = 0; i < 42; i++) {
    let day, date, outside = false;

    if (i < firstDay) {
      day = previousDays - firstDay + i + 1;
      date = new Date(year, month - 1, day);
      outside = true;
    } else if (i >= firstDay + daysInMonth) {
      day = i - firstDay - daysInMonth + 1;
      date = new Date(year, month + 1, day);
      outside = true;
    } else {
      day = i - firstDay + 1;
      date = new Date(year, month, day);
    }

    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");

    const events = [
      ...data.tasks.filter(t => t.due === key),
      ...data.events.filter(e => e.date === key)
    ];

    cells += `
      <button class="calendar-day ${outside ? "muted-day" : ""} ${key === today ? "today" : ""}"
        onclick="calendarDay('${key}')">
        ${day}
        ${events.slice(0, 3).map(event => `
          <span class="calendar-event">${escapeHTML(event.title)}</span>
        `).join("")}
        ${events.length > 3 ? `<span class="calendar-event">+${events.length - 3} mais</span>` : ""}
      </button>
    `;
  }

  $("#pageContent").innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Calendário</h2>
        <p>Visualize prazos e eventos importantes.</p>
      </div>
      <button class="primary" onclick="openEventModal()">+ Novo evento</button>
    </div>

    <div class="panel">
      <div class="calendar-head">
        <button class="secondary" onclick="changeMonth(-1)">‹ Anterior</button>
        <h3>${calendarDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h3>
        <button class="secondary" onclick="changeMonth(1)">Próximo ›</button>
      </div>

      <div class="calendar-grid">
        ${["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => `<div class="calendar-day-name">${d}</div>`).join("")}
        ${cells}
      </div>
    </div>
  `;
}

function changeMonth(amount) {
  calendarDate.setMonth(calendarDate.getMonth() + amount);
  renderCalendar();
}

function calendarDay(date) {
  const tasks = data.tasks.filter(t => t.due === date);
  const events = data.events.filter(e => e.date === date);

  const content = [
    ...tasks.map(t => "Tarefa: " + t.title),
    ...events.map(e => "Evento: " + e.title)
  ];

  toast(content.length ? content.join(" | ") : "Nenhum compromisso nesta data.");
}

function openEventModal(date = "") {
  showModal("Novo evento", `
    <div class="form-field">
      <label>Nome do evento</label>
      <input name="title" required maxlength="80">
    </div>
    <div class="form-field">
      <label>Data</label>
      <input type="date" name="date" required value="${date}">
    </div>
    <div class="form-field">
      <label>Descrição</label>
      <textarea name="description"></textarea>
    </div>
  `, values => {
    data.events.push({ id: id(), ...values });
    log(`Evento "${values.title}" criado.`);
    saveData();
    closeModal();
    render();
    toast("Evento adicionado!");
  });
}

function renderHistory() {
  $("#pageContent").innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Histórico de atividades</h2>
        <p>Acompanhe as alterações realizadas.</p>
      </div>
      <button class="danger" onclick="clearHistory()">Limpar histórico</button>
    </div>
    <div class="panel">
      ${data.history.length
        ? data.history.map(item => `
          <div class="list-row">
            <div>
              ${escapeHTML(item.message)}
              <small>${new Date(item.date).toLocaleString("pt-BR")}</small>
            </div>
          </div>
        `).join("")
        : emptyState("Histórico vazio", "As atividades aparecerão aqui.")}
    </div>
  `;
}

function clearHistory() {
  if (!confirm("Deseja apagar todo o histórico?")) return;
  data.history = [];
  saveData();
  render();
  toast("Histórico limpo.");
}

function renderStatistics() {
  const total = data.tasks.length;
  const done = data.tasks.filter(t => t.done).length;
  const pending = total - done;
  const progress = total ? Math.round(done / total * 100) : 0;

  const priorities = ["Alta", "Média", "Baixa"];

  $("#pageContent").innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Estatísticas avançadas</h2>
        <p>Uma visão geral da sua produtividade.</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><span>Total de tarefas</span><strong>${total}</strong></div>
      <div class="stat-card"><span>Concluídas</span><strong>${done}</strong></div>
      <div class="stat-card"><span>Pendentes</span><strong>${pending}</strong></div>
      <div class="stat-card"><span>Progresso geral</span><strong>${progress}%</strong></div>
    </div>

    <div class="content-grid">
      <div class="panel">
        <h3>Conclusão de tarefas</h3>
        <div class="progress-track" style="height:14px">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>
        <p class="muted">${done} de ${total} tarefas concluídas.</p>
      </div>

      <div class="panel">
        <h3>Prioridades</h3>
        ${priorities.map(priority => {
          const count = data.tasks.filter(t => t.priority === priority).length;
          const percent = total ? Math.round(count / total * 100) : 0;
          return `
            <div class="list-row">
              <div style="flex:1">
                <strong>${priority}</strong>
                <div class="progress-track">
                  <div class="progress-fill" style="width:${percent}%"></div>
                </div>
              </div>
              <strong>${count}</strong>
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <div class="panel" style="margin-top:18px">
      <h3>Progresso por projeto</h3>
      ${data.projects.map(project => `
        <div class="list-row">
          <div style="flex:1">
            <strong>${escapeHTML(project.name)}</strong>
            <div class="progress-track">
              <div class="progress-fill" style="width:${projectProgress(project.id)}%"></div>
            </div>
          </div>
          <strong>${projectProgress(project.id)}%</strong>
        </div>
      `).join("") || emptyState("Sem projetos", "Crie projetos para gerar estatísticas.")}
    </div>
  `;
}

function renderTags() {
  $("#pageContent").innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Etiquetas</h2>
        <p>Classifique seus projetos e tarefas.</p>
      </div>
      <button class="primary" onclick="openTagModal()">+ Nova etiqueta</button>
    </div>

    <div class="tag-grid">
      ${data.tags.map(tag => `
        <div class="tag-card">
          <span class="tag" style="background:${tag.color}22;color:${tag.color}">
            ${escapeHTML(tag.name)}
          </span>
          <p class="card-description">
            ${data.projects.filter(p => (p.tags || []).includes(tag.id)).length} projetos associados
          </p>
          <div class="card-actions">
            <button class="small-button" onclick="editTag('${tag.id}')">Editar</button>
            <button class="small-button" onclick="moveToTrash('tag','${tag.id}')">Excluir</button>
          </div>
        </div>
      `).join("") || emptyState("Nenhuma etiqueta", "Crie etiquetas para organizar seus projetos.")}
    </div>
  `;
}

function openTagModal(tag = null) {
  editing = tag ? { type: "tag", id: tag.id } : null;
  selectedColor = tag?.color || "#3985ee";

  showModal(tag ? "Editar etiqueta" : "Nova etiqueta", `
    <div class="form-field">
      <label>Nome</label>
      <input name="name" required maxlength="30" value="${escapeHTML(tag?.name || "")}">
    </div>
    <div class="form-field">
      <label>Cor</label>
      <input name="color" type="color" value="${selectedColor}">
    </div>
  `, values => {
    if (editing) {
      Object.assign(tag, values);
      log(`Etiqueta "${tag.name}" atualizada.`);
    } else {
      data.tags.push({ id: id(), ...values });
      log(`Etiqueta "${values.name}" criada.`);
    }

    saveData();
    closeModal();
    render();
    toast("Etiqueta salva!");
  });
}

function editTag(tagId) {
  const tag = getTag(tagId);
  if (tag) openTagModal(tag);
}

function renderNotes() {
  $("#pageContent").innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Bloco de anotações</h2>
        <p>Suas ideias ficam salvas automaticamente neste navegador.</p>
      </div>
      <span class="pill active">Salvamento automático</span>
    </div>
    <textarea class="note-area" id="notesArea" placeholder="Escreva suas ideias aqui...">${escapeHTML(data.notes)}</textarea>
  `;

  $("#notesArea").addEventListener("input", event => {
    data.notes = event.target.value;
    saveData();
  });
}

function moveToTrash(type, itemId) {
  if (!confirm("Mover este item para a lixeira?")) return;

  const collection = {
    project: "projects",
    task: "tasks",
    tag: "tags"
  }[type];

  const index = data[collection].findIndex(item => item.id === itemId);
  if (index < 0) return;

  const [item] = data[collection].splice(index, 1);

  data.trash.unshift({
    id: id(),
    type,
    item,
    deletedAt: new Date().toISOString()
  });

  log(`${type === "project" ? "Projeto" : type === "task" ? "Tarefa" : "Etiqueta"} movido para a lixeira.`);
  saveData();
  render();
  toast("Item enviado para a lixeira.");
}

function restoreTrash(trashId) {
  const index = data.trash.findIndex(item => item.id === trashId);
  if (index < 0) return;

  const [entry] = data.trash.splice(index, 1);
  const collection = {
    project: "projects",
    task: "tasks",
    tag: "tags"
  }[entry.type];

  data[collection].push(entry.item);
  log("Item restaurado da lixeira.");
  saveData();
  render();
  toast("Item restaurado!");
}

function permanentlyDelete(trashId) {
  if (!confirm("Excluir este item permanentemente?")) return;

  data.trash = data.trash.filter(item => item.id !== trashId);
  saveData();
  render();
  toast("Item excluído permanentemente.");
}

function emptyTrash() {
  if (!confirm("Esvaziar toda a lixeira? Esta ação não poderá ser desfeita.")) return;

  data.trash = [];
  saveData();
  render();
  toast("Lixeira esvaziada.");
}

function renderTrash() {
  $("#pageContent").innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Lixeira</h2>
        <p>Restaure itens ou exclua-os permanentemente.</p>
      </div>
      <button class="danger" onclick="emptyTrash()">Esvaziar lixeira</button>
    </div>

    <div class="panel">
      ${data.trash.length
        ? data.trash.map(entry => `
          <div class="list-row">
            <div>
              <strong>${escapeHTML(entry.item.name || entry.item.title || "Item")}</strong>
              <small>${entry.type} · Excluído em ${new Date(entry.deletedAt).toLocaleString("pt-BR")}</small>
            </div>
            <div class="card-actions">
              <button class="small-button" onclick="restoreTrash('${entry.id}')">Restaurar</button>
              <button class="small-button" onclick="permanentlyDelete('${entry.id}')">Excluir</button>
            </div>
          </div>
        `).join("")
        : emptyState("A lixeira está vazia", "Itens excluídos aparecerão aqui.")}
    </div>
  `;
}

function renderAppearance() {
  const colors = ["#2563eb","#16a36a","#8b5cf6","#e05252","#e59a25","#0891b2","#db4b9b"];

  $("#pageContent").innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Personalização</h2>
        <p>Configure a aparência da Practical 44.</p>
      </div>
    </div>

    <div class="panel">
      <h3>Tema</h3>
      <div class="toolbar" style="margin-top:15px">
        <button class="secondary" onclick="setTheme('light')">☀ Claro</button>
        <button class="secondary" onclick="setTheme('dark')">☾ Escuro</button>
      </div>

      <hr style="border:0;border-top:1px solid var(--border);margin:20px 0">

      <h3>Cor de destaque</h3>
      <div class="color-options" style="margin:15px 0">
        ${colors.map(color => `
          <button class="color-choice ${data.settings.accent === color ? "selected" : ""}"
            style="background:${color}" onclick="setAccent('${color}')"></button>
        `).join("")}
      </div>

      <hr style="border:0;border-top:1px solid var(--border);margin:20px 0">

      <h3>Densidade da interface</h3>
      <div class="toolbar" style="margin-top:15px">
        <button class="secondary" onclick="setDensity('compact')">Compacta</button>
        <button class="secondary" onclick="setDensity('normal')">Normal</button>
        <button class="secondary" onclick="setDensity('comfortable')">Confortável</button>
      </div>

      <hr style="border:0;border-top:1px solid var(--border);margin:20px 0">

      <h3>Nome do painel</h3>
      <div class="toolbar" style="margin-top:15px">
        <input class="search-input" id="panelName" value="${escapeHTML(data.settings.panelName)}">
        <button class="primary" onclick="savePanelName()">Salvar nome</button>
      </div>
    </div>
  `;
}

function setTheme(theme) {
  data.settings.theme = theme;
  saveData();
  applySettings();
  render();
  toast("Tema atualizado!");
}

function setAccent(color) {
  data.settings.accent = color;
  saveData();
  applySettings();
  render();
}

function setDensity(density) {
  data.settings.density = density;
  saveData();
  applySettings();
  render();
  toast("Densidade atualizada!");
}

function savePanelName() {
  data.settings.panelName = $("#panelName").value.trim() || "Practical 44";
  saveData();
  applySettings();
  toast("Nome atualizado!");
}

function renderSettings() {
  $("#pageContent").innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Configurações</h2>
        <p>Gerencie seus dados e preferências.</p>
      </div>
    </div>

    <div class="panel">
      <div class="settings-row">
        <div>
          <strong>Exportar backup</strong>
          <p>Salve todos os seus dados em um arquivo JSON.</p>
        </div>
        <button class="primary" onclick="exportBackup()">Exportar</button>
      </div>

      <div class="settings-row">
        <div>
          <strong>Restaurar backup</strong>
          <p>Carregue um backup anterior da Practical 44.</p>
        </div>
        <button class="secondary" onclick="$('#backupInput').click()">Restaurar</button>
        <input id="backupInput" type="file" accept=".json,application/json" hidden onchange="importBackup(event)">
      </div>

      <div class="settings-row">
        <div>
          <strong>Exportar projetos</strong>
          <p>Baixe a lista de projetos em JSON.</p>
        </div>
        <button class="secondary" onclick="exportProjects()">Exportar</button>
      </div>

      <div class="settings-row">
        <div>
          <strong>Importar projetos</strong>
          <p>Adicione projetos de um arquivo JSON.</p>
        </div>
        <button class="secondary" onclick="$('#projectsInput').click()">Importar</button>
        <input id="projectsInput" type="file" accept=".json,application/json" hidden onchange="importProjects(event)">
      </div>

      <div class="settings-row">
        <div>
          <strong>Redefinir configurações visuais</strong>
          <p>Voltar ao tema e às opções padrão.</p>
        </div>
        <button class="secondary" onclick="resetAppearance()">Redefinir</button>
      </div>
    </div>

    <div class="panel" style="margin-top:18px">
      <h3>Sobre</h3>
      <p class="card-description">
        Practical 44 Web Edition 0.7<br>
        HTML · CSS · JavaScript · LocalStorage<br>
        Desenvolvido para organização e produtividade.
      </p>
    </div>
  `;
}

function downloadJSON(filename, object) {
  const blob = new Blob([JSON.stringify(object, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportBackup() {
  downloadJSON("practical44-backup.json", {
    version: "0.7",
    exportedAt: new Date().toISOString(),
    data
  });

  toast("Backup exportado!");
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const backup = JSON.parse(reader.result);
      const restored = backup.data || backup;

      if (!restored || !Array.isArray(restored.projects) ||
          !Array.isArray(restored.tasks)) {
        throw new Error("Formato inválido");
      }

      if (!confirm("Restaurar este backup? Os dados atuais serão substituídos.")) return;

      data = { ...defaultData, ...restored };
      saveData();
      applySettings();
      navigate("dashboard");
      toast("Backup restaurado!");
    } catch {
      toast("Arquivo de backup inválido.");
    }
  };

  reader.readAsText(file);
  event.target.value = "";
}

function exportProjects() {
  downloadJSON("practical44-projetos.json", data.projects);
  toast("Projetos exportados!");
}

function importProjects(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const projects = JSON.parse(reader.result);
      if (!Array.isArray(projects)) throw new Error();

      let count = 0;

      projects.forEach(project => {
        if (!project.name) return;

        data.projects.push({
          id: id(),
          name: String(project.name),
          description: String(project.description || ""),
          status: project.status === "paused" ? "paused" : "active",
          tags: [],
          created: new Date().toISOString()
        });

        count++;
      });

      log(`${count} projetos importados.`);
      saveData();
      render();
      toast(`${count} projetos importados!`);
    } catch {
      toast("Arquivo de projetos inválido.");
    }
  };

  reader.readAsText(file);
  event.target.value = "";
}

function resetAppearance() {
  if (!confirm("Restaurar as configurações visuais padrão?")) return;

  data.settings = { ...defaultData.settings };
  saveData();
  applySettings();
  render();
  toast("Aparência redefinida.");
}

/* MODAL */

function showModal(title, fields, callback) {
  editingCallback = callback;
  $("#modalTitle").textContent = title;
  $("#modalFields").innerHTML = fields;
  $("#modalBackdrop").classList.add("open");
}

let editingCallback = null;

function closeModal() {
  $("#modalBackdrop").classList.remove("open");
  $("#itemForm").reset();
  editing = null;
  editingCallback = null;
}

$("#itemForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!editingCallback) return;

  const formData = new FormData(event.target);
  const values = {};

  for (const [key, value] of formData.entries()) {
    if (key !== "tags") values[key] = value;
  }

  editingCallback(values);
});

$("#closeModal").addEventListener("click", closeModal);
$("#cancelModal").addEventListener("click", closeModal);

$("#modalBackdrop").addEventListener("click", event => {
  if (event.target === $("#modalBackdrop")) closeModal();
});

/* NAVEGAÇÃO */

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.page));
});

$("#menuButton").addEventListener("click", () => {
  $("#sidebar").classList.toggle("open");
});

$("#quickAdd").addEventListener("click", () => {
  if (currentPage === "tasks") openTaskModal();
  else openProjectModal();
});

/* INICIALIZAÇÃO */

applySettings();
navigate("dashboard");

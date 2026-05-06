const groupsRoot = document.getElementById("groupsRoot");
const readerModal = document.getElementById("readerModal");
const readerBackdrop = document.getElementById("readerBackdrop");
const readerType = document.getElementById("readerType");
const readerTitle = document.getElementById("readerTitle");
const readerContent = document.getElementById("readerContent");
const closeReader = document.getElementById("closeReader");
const themeToggle = document.getElementById("themeToggle");

function normalizeFormat(formatValue) {
	if (!formatValue) return "left-aligned";
	return String(formatValue).trim().toLowerCase();
}

function getTheme() {
	return localStorage.getItem("theme") || "light";
}

function setTheme(theme) {
	document.documentElement.setAttribute("data-theme", theme);
	themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
	localStorage.setItem("theme", theme);
}

function toggleTheme() {
	const next = getTheme() === "dark" ? "light" : "dark";
	setTheme(next);
}

function clearReaderFormatClasses() {
	readerContent.classList.remove("format-centered", "format-left-aligned");
}

function applyReaderFormat(formatValue) {
	clearReaderFormatClasses();
	const normalized = normalizeFormat(formatValue);
	if (normalized === "centered") {
		readerContent.classList.add("format-centered");
		return;
	}
	readerContent.classList.add("format-left-aligned");
}

function setReaderState(stateClass, text) {
	readerContent.classList.remove("is-loading", "is-error");
	if (stateClass) {
		readerContent.classList.add(stateClass);
	}
	readerContent.textContent = text;
}

function openReader() {
	readerModal.hidden = false;
	readerModal.setAttribute("aria-hidden", "false");
	document.body.classList.add("modal-open");
}

function closeReaderModal() {
	readerModal.hidden = true;
	readerModal.setAttribute("aria-hidden", "true");
	document.body.classList.remove("modal-open");
}

function resolveProjectPath(filename) {
	if (!filename) {
		return "";
	}

	if (filename.includes("/") || filename.includes("\\")) {
		return filename;
	}

	return `Texts/${filename}`;
}

async function loadPiece(project) {
	openReader();
	readerType.textContent = project.type;
	readerTitle.textContent = project.title;
	applyReaderFormat(project.format);
	setReaderState("is-loading", "Loading text...");

	try {
		const response = await fetch(resolveProjectPath(project.filename));
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const text = await response.text();
		setReaderState("", text);
		readerContent.focus();
	} catch (error) {
		console.error("Failed to load piece", error);
		setReaderState("is-error", "Could not load this text file.");
	}
}

function renderGroups(projects) {
	groupsRoot.innerHTML = "";
	const grouped = new Map();

	projects.forEach((project) => {
		const groupKey = project.type || "other";
		if (!grouped.has(groupKey)) {
			grouped.set(groupKey, []);
		}
		grouped.get(groupKey).push(project);
	});

	[...grouped.entries()].forEach(([type, items]) => {
		const section = document.createElement("section");
		section.className = "type-group";

		const heading = document.createElement("h2");
		heading.textContent = type;
		section.appendChild(heading);

		const grid = document.createElement("div");
		grid.className = "group-grid";

		items.forEach((project) => {
			const card = document.createElement("article");
			card.className = "piece-card";

			const title = document.createElement("h3");
			title.textContent = project.title;

			const button = document.createElement("button");
			button.className = "read-btn";
			button.type = "button";
			button.textContent = "Read";
			button.addEventListener("click", () => {
				loadPiece(project);
			});

			card.appendChild(title);
			card.appendChild(button);
			grid.appendChild(card);
		});

		section.appendChild(grid);
		groupsRoot.appendChild(section);
	});
}

async function loadProjects() {
	try {
		const response = await fetch("projects.json");
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const projects = await response.json();
		renderGroups(projects);
	} catch (error) {
		console.error("Failed to load projects", error);
		groupsRoot.innerHTML = "<p class='loading'>Could not load projects.json.</p>";
	}
}

closeReader.addEventListener("click", closeReaderModal);
readerBackdrop.addEventListener("click", closeReaderModal);

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape" && !readerModal.hidden) {
		closeReaderModal();
	}
});

themeToggle.addEventListener("click", toggleTheme);
setTheme(getTheme());
closeReaderModal();
loadProjects();

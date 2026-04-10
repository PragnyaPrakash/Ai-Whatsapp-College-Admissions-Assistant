const state = {
  colleges: [],
  editingId: null,
  query: ""
};

const elements = {
  collegeCount: document.getElementById("collegeCount"),
  activeCount: document.getElementById("activeCount"),
  collegeList: document.getElementById("collegeList"),
  collegeForm: document.getElementById("collegeForm"),
  resetFormButton: document.getElementById("resetFormButton"),
  refreshButton: document.getElementById("refreshButton"),
  searchInput: document.getElementById("searchInput"),
  statusMessage: document.getElementById("statusMessage"),
  formTitle: document.getElementById("formTitle"),
  submitButton: document.getElementById("submitButton"),
  deactivateButton: document.getElementById("deactivateButton"),
  cardTemplate: document.getElementById("collegeCardTemplate"),
  id: document.getElementById("id"),
  name: document.getElementById("name"),
  location: document.getElementById("location"),
  streams: document.getElementById("streams"),
  feesInrPerYear: document.getElementById("feesInrPerYear"),
  applicationDeadline: document.getElementById("applicationDeadline"),
  applicationMode: document.getElementById("applicationMode"),
  eligibility: document.getElementById("eligibility"),
  website: document.getElementById("website"),
  highlights: document.getElementById("highlights"),
  isActive: document.getElementById("isActive")
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function setStatus(message, tone = "success") {
  elements.statusMessage.textContent = message;
  elements.statusMessage.style.color = tone === "error" ? "#9f1239" : "#0f766e";
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function formToPayload() {
  const formData = new FormData(elements.collegeForm);
  return {
    id: formData.get("id").trim(),
    name: formData.get("name").trim(),
    location: formData.get("location").trim(),
    streams: formData
      .get("streams")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    feesInrPerYear: Number(formData.get("feesInrPerYear")),
    applicationDeadline: formData.get("applicationDeadline"),
    applicationMode: formData.get("applicationMode").trim(),
    eligibility: formData.get("eligibility").trim(),
    website: formData.get("website").trim(),
    highlights: formData
      .get("highlights")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    isActive: document.getElementById("isActive").checked
  };
}

function fillForm(college) {
  elements.id.value = college.id;
  elements.name.value = college.name;
  elements.location.value = college.location;
  elements.streams.value = college.streams.join(", ");
  elements.feesInrPerYear.value = college.feesInrPerYear;
  elements.applicationDeadline.value = college.applicationDeadline;
  elements.applicationMode.value = college.applicationMode;
  elements.eligibility.value = college.eligibility;
  elements.website.value = college.website;
  elements.highlights.value = college.highlights.join(", ");
  elements.isActive.checked = college.isActive;

  state.editingId = college.id;
  elements.formTitle.textContent = `Edit ${college.name}`;
  elements.submitButton.textContent = "Update college";
  elements.deactivateButton.classList.toggle("hidden", !college.isActive);
}

function resetForm() {
  elements.collegeForm.reset();
  elements.isActive.checked = true;
  state.editingId = null;
  elements.formTitle.textContent = "Add a college";
  elements.submitButton.textContent = "Save college";
  elements.deactivateButton.classList.add("hidden");
}

function renderStats() {
  elements.collegeCount.textContent = state.colleges.length;
  elements.activeCount.textContent = state.colleges.filter((college) => college.isActive).length;
}

function matchesQuery(college) {
  if (!state.query) {
    return true;
  }

  const haystack = [
    college.name,
    college.location,
    ...(college.streams || []),
    ...(college.highlights || [])
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(state.query);
}

function createTag(text) {
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = text;
  return tag;
}

function renderCollegeList() {
  elements.collegeList.innerHTML = "";
  const filtered = state.colleges.filter(matchesQuery);

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No colleges match this search yet.";
    elements.collegeList.appendChild(empty);
    return;
  }

  for (const college of filtered) {
    const fragment = elements.cardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".college-card");

    fragment.querySelector(".college-name").textContent = college.name;
    fragment.querySelector(".college-location").textContent = college.location;
    fragment.querySelector(".college-fees").textContent = formatCurrency(college.feesInrPerYear);
    fragment.querySelector(".college-deadline").textContent = college.applicationDeadline;
    fragment.querySelector(".college-mode").textContent = college.applicationMode;

    const statusPill = fragment.querySelector(".status-pill");
    statusPill.textContent = college.isActive ? "Active" : "Inactive";
    statusPill.classList.toggle("inactive", !college.isActive);

    const streamsRow = fragment.querySelector(".streams-row");
    college.streams.forEach((stream) => streamsRow.appendChild(createTag(stream)));

    const highlightsRow = fragment.querySelector(".highlights-row");
    college.highlights.slice(0, 3).forEach((highlight) => highlightsRow.appendChild(createTag(highlight)));

    fragment.querySelector(".edit-button").addEventListener("click", () => {
      fillForm(college);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setStatus(`Editing ${college.name}.`);
    });

    const deactivateButton = fragment.querySelector(".deactivate-card-button");
    deactivateButton.disabled = !college.isActive;
    deactivateButton.addEventListener("click", () => deactivateCollege(college.id));

    card.dataset.collegeId = college.id;
    elements.collegeList.appendChild(fragment);
  }
}

async function loadColleges() {
  const response = await fetch("/api/colleges");

  if (!response.ok) {
    throw new Error("Failed to load colleges");
  }

  const data = await response.json();
  state.colleges = data.colleges || [];
  renderStats();
  renderCollegeList();
}

async function saveCollege(event) {
  event.preventDefault();
  const payload = formToPayload();

  if (!payload.id || !payload.name) {
    setStatus("College ID and name are required.", "error");
    return;
  }

  const method = state.editingId ? "PUT" : "POST";
  const url = state.editingId ? `/api/colleges/${encodeURIComponent(state.editingId)}` : "/api/colleges";

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Could not save the college");
  }

  await loadColleges();
  resetForm();
  setStatus(`${payload.name} has been saved.`);
}

async function deactivateCollege(id) {
  const college = state.colleges.find((item) => item.id === id);

  if (!college) {
    return;
  }

  const confirmed = window.confirm(`Deactivate ${college.name}? Students will stop seeing it in recommendations.`);
  if (!confirmed) {
    return;
  }

  const response = await fetch(`/api/colleges/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Could not deactivate the college");
  }

  await loadColleges();

  if (state.editingId === id) {
    resetForm();
  }

  setStatus(`${college.name} has been deactivated.`);
}

elements.collegeForm.addEventListener("submit", async (event) => {
  try {
    await saveCollege(event);
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Something went wrong while saving.", "error");
  }
});

elements.resetFormButton.addEventListener("click", () => {
  resetForm();
  setStatus("Ready for a new college entry.");
});

elements.refreshButton.addEventListener("click", async () => {
  try {
    await loadColleges();
    setStatus("Dashboard refreshed.");
  } catch (error) {
    console.error(error);
    setStatus("Could not refresh the dashboard.", "error");
  }
});

elements.searchInput.addEventListener("input", (event) => {
  state.query = normalizeText(event.target.value);
  renderCollegeList();
});

elements.deactivateButton.addEventListener("click", async () => {
  if (!state.editingId) {
    return;
  }

  try {
    await deactivateCollege(state.editingId);
  } catch (error) {
    console.error(error);
    setStatus("Could not deactivate the selected college.", "error");
  }
});

loadColleges()
  .then(() => setStatus("Dashboard ready."))
  .catch((error) => {
    console.error(error);
    setStatus("Could not load the admin dashboard data.", "error");
  });

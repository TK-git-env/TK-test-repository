document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimeoutId;

  if (!activitiesList || !activitySelect || !signupForm || !messageDiv) {
    console.error("Required activity page elements are missing.");
    return;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    clearTimeout(messageTimeoutId);
    messageTimeoutId = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participantList = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = Math.max(0, Number(details.max_participants) - participantList.length);
        const participants = participantList;
        const participantsMarkup = participants.length
          ? `<ul class="participants-list">${participants
              .map(
                (participant) => `
                  <li class="participant-item">
                    <span class="participant-name">${escapeHtml(participant)}</span>
                    <button
                      type="button"
                      class="participant-delete"
                      data-activity="${escapeHtml(name)}"
                      data-participant="${escapeHtml(participant)}"
                      aria-label="Remove ${escapeHtml(participant)}"
                      title="Remove participant"
                    >🗑️</button>
                  </li>
                `
              )
              .join("")}</ul>`
          : `<p class="participants-empty">No participants yet — be the first to sign up!</p>`;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            ${participantsMarkup}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      const activityListButtons = activitiesList.querySelectorAll(".participant-delete");
      activityListButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const activityName = button.dataset.activity;
          const participantEmail = button.dataset.participant;

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(participantEmail)}`,
              {
                method: "DELETE",
              }
            );

            let result = {};
            try {
              result = await response.json();
            } catch (error) {
              result = {};
            }

            if (response.ok) {
              showMessage(result.message || "Participant removed successfully.", "success");
              await fetchActivities();
            } else {
              showMessage(result.detail || "An error occurred", "error");
            }
          } catch (error) {
            showMessage("Failed to remove participant. Please try again.", "error");
            console.error("Error removing participant:", error);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        const detail = result.detail || "An error occurred";
        showMessage(detail, "error");
        window.alert(detail);
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

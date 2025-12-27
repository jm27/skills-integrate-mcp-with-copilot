document.addEventListener("DOMContentLoaded", () => {
  // View toggle elements
  const adminViewBtn = document.getElementById("admin-view-btn");
  const studentViewBtn = document.getElementById("student-view-btn");
  const adminDashboard = document.getElementById("admin-dashboard");
  const studentDashboard = document.getElementById("student-dashboard");

  // Student lookup elements
  const studentEmailInput = document.getElementById("student-email");
  const lookupBtn = document.getElementById("lookup-btn");
  const studentStats = document.getElementById("student-stats");

  // Toggle between admin and student views
  adminViewBtn.addEventListener("click", () => {
    adminViewBtn.classList.add("active");
    studentViewBtn.classList.remove("active");
    adminDashboard.classList.remove("hidden");
    studentDashboard.classList.add("hidden");
  });

  studentViewBtn.addEventListener("click", () => {
    studentViewBtn.classList.add("active");
    adminViewBtn.classList.remove("active");
    studentDashboard.classList.remove("hidden");
    adminDashboard.classList.add("hidden");
  });

  // Fetch and display admin analytics
  async function loadAdminAnalytics() {
    try {
      const response = await fetch("/analytics/overview");
      const data = await response.json();

      // Update stat cards
      document.getElementById("total-students").textContent =
        data.total_students;
      document.getElementById("total-activities").textContent =
        data.total_activities;
      document.getElementById("avg-enrollment").textContent =
        data.average_enrollment.toFixed(1);
      document.getElementById("overall-utilization").textContent =
        data.overall_utilization.toFixed(1) + "%";

      // Create enrollment chart
      createEnrollmentChart(data.activity_stats);

      // Create utilization chart
      createUtilizationChart(data.activity_stats);

      // Display activity details
      displayActivityDetails(data.activity_stats);
    } catch (error) {
      console.error("Error loading admin analytics:", error);
    }
  }

  // Create enrollment bar chart
  function createEnrollmentChart(activityStats) {
    const container = document.getElementById("enrollment-chart");
    container.innerHTML = "";

    // Find max value for scaling
    const maxValue = Math.max(...activityStats.map((a) => a.capacity));

    activityStats.forEach((activity) => {
      const barGroup = document.createElement("div");
      barGroup.className = "bar-group";

      const label = document.createElement("div");
      label.className = "bar-label";
      label.textContent = activity.name;

      const barsContainer = document.createElement("div");
      barsContainer.className = "bars-container";

      // Capacity bar (background)
      const capacityBar = document.createElement("div");
      capacityBar.className = "bar bar-capacity";
      capacityBar.style.width = (activity.capacity / maxValue) * 100 + "%";
      capacityBar.title = `Capacity: ${activity.capacity}`;

      // Enrollment bar (foreground)
      const enrollmentBar = document.createElement("div");
      enrollmentBar.className = "bar bar-enrollment";
      enrollmentBar.style.width = (activity.enrollment / maxValue) * 100 + "%";
      enrollmentBar.textContent = `${activity.enrollment}/${activity.capacity}`;
      enrollmentBar.title = `Enrolled: ${activity.enrollment}`;

      barsContainer.appendChild(capacityBar);
      barsContainer.appendChild(enrollmentBar);

      barGroup.appendChild(label);
      barGroup.appendChild(barsContainer);
      container.appendChild(barGroup);
    });
  }

  // Create utilization pie chart
  function createUtilizationChart(activityStats) {
    const container = document.getElementById("utilization-chart");
    container.innerHTML = "";

    // Calculate totals
    const totalEnrolled = activityStats.reduce(
      (sum, a) => sum + a.enrollment,
      0
    );
    const totalCapacity = activityStats.reduce((sum, a) => sum + a.capacity, 0);
    const availableSpots = totalCapacity - totalEnrolled;
    const utilizationPercent = ((totalEnrolled / totalCapacity) * 100).toFixed(1);

    // Create visual representation
    const pieVisual = document.createElement("div");
    pieVisual.className = "pie-visual";
    
    const enrolledSegment = document.createElement("div");
    enrolledSegment.className = "pie-segment enrolled";
    enrolledSegment.style.width = utilizationPercent + "%";
    
    const availableSegment = document.createElement("div");
    availableSegment.className = "pie-segment available";
    availableSegment.style.width = (100 - utilizationPercent) + "%";
    
    pieVisual.appendChild(enrolledSegment);
    pieVisual.appendChild(availableSegment);

    // Create legend
    const legend = document.createElement("div");
    legend.className = "pie-legend";
    legend.innerHTML = `
      <div class="legend-item">
        <span class="legend-color enrolled"></span>
        <span>Enrolled: ${totalEnrolled} (${utilizationPercent}%)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color available"></span>
        <span>Available: ${availableSpots} (${(100 - utilizationPercent).toFixed(1)}%)</span>
      </div>
      <div class="legend-total">
        <strong>Total Capacity: ${totalCapacity}</strong>
      </div>
    `;

    container.appendChild(pieVisual);
    container.appendChild(legend);
  }

  // Display activity details table
  function displayActivityDetails(activityStats) {
    const detailsList = document.getElementById("activity-details-list");
    detailsList.innerHTML = "";

    activityStats.forEach((activity) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-detail-card";

      const utilizationColor =
        activity.utilization > 80
          ? "#4caf50"
          : activity.utilization > 50
          ? "#ff9800"
          : "#f44336";

      activityCard.innerHTML = `
        <div class="activity-detail-header">
          <h4>${activity.name}</h4>
          <span class="utilization-badge" style="background-color: ${utilizationColor}">
            ${activity.utilization}%
          </span>
        </div>
        <div class="activity-detail-stats">
          <p><strong>Enrollment:</strong> ${activity.enrollment} / ${activity.capacity}</p>
          <p><strong>Available Spots:</strong> ${
            activity.capacity - activity.enrollment
          }</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${
              activity.utilization
            }%; background-color: ${utilizationColor}"></div>
          </div>
        </div>
      `;

      detailsList.appendChild(activityCard);
    });
  }

  // Student lookup functionality
  lookupBtn.addEventListener("click", async () => {
    const email = studentEmailInput.value.trim();
    const messageDiv = document.getElementById("student-message");
    
    if (!email) {
      messageDiv.textContent = "Please enter a student email";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      return;
    }

    try {
      const response = await fetch(
        `/analytics/student/${encodeURIComponent(email)}`
      );
      
      if (!response.ok) {
        throw new Error("Student not found or error loading data");
      }
      
      const data = await response.json();

      // Show student stats section
      studentStats.classList.remove("hidden");
      
      // Hide any previous messages
      messageDiv.classList.add("hidden");

      // Update stat cards
      document.getElementById("student-activities").textContent =
        data.total_enrolled;
      document.getElementById("student-hours").textContent =
        data.hours_per_week.toFixed(1);
      document.getElementById("student-attendance").textContent =
        data.attendance_rate + "%";
      document.getElementById("student-completion").textContent =
        data.completion_rate + "%";

      // Display student activities
      displayStudentActivities(data.activities);
    } catch (error) {
      console.error("Error loading student analytics:", error);
      messageDiv.textContent = "Error loading student data. Please check the email and try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      studentStats.classList.add("hidden");
    }
  });

  // Display student activities list
  function displayStudentActivities(activities) {
    const activitiesList = document.getElementById("student-activities-list");
    activitiesList.innerHTML = "";

    if (activities.length === 0) {
      activitiesList.innerHTML = "<p class='no-data'>Not enrolled in any activities yet.</p>";
      return;
    }

    activities.forEach((activity) => {
      const activityCard = document.createElement("div");
      activityCard.className = "student-activity-card";

      activityCard.innerHTML = `
        <h4>${activity.name}</h4>
        <p><strong>Schedule:</strong> ${activity.schedule}</p>
      `;

      activitiesList.appendChild(activityCard);
    });
  }

  // Initialize admin dashboard on load
  loadAdminAnalytics();
});

function showTier(tierName, clickedButton) {
  // Hide all tab content
  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.style.display = "none";
  });
  console.log(tierName);
  // Deactivate all tabs
  document.querySelectorAll(".tab-links").forEach(btn => {
    btn.classList.remove("active");
  });

  // Show selected tab
  clickedButton.classList.add("active");
  document.getElementById(tierName).style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-links");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;
      showTier(tabName, btn);
      renderTree(tabName)
    });
  });

  // lightweight tab is the default
  tabButtons[1]?.click();
});

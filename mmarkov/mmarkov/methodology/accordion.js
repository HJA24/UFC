document.addEventListener("DOMContentLoaded", () => {
  const accordion = document.querySelector(".accordion");
  accordion.addEventListener("click", () => {
    // Find the next panel element after the closest parent <p>
    let panel = document.querySelector(".panel");

    // Toggle panel
    const isOpen = panel.style.maxHeight;
    if (isOpen) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + "px";
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

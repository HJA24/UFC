document.querySelectorAll(".container input").forEach(input => {
  input.addEventListener("change", () => {
    if (input.checked) {
      const label = input.parentElement.textContent;
      addBookiePoint(label);
    }
  });
});

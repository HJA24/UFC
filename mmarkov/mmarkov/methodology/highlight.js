const Q = document.querySelector(".Q");
const R = document.querySelector(".R");
const I = document.querySelector(".I");
const O = document.querySelector(".O");
const A = document.querySelector(".numberOfStrikesAttemptedBlue");
const B = document.querySelector(".numberOfStrikesAttemptedRed");
const C = document.querySelector(".numberOfStrikesLandedBlue");
const D = document.querySelector(".numberOfStrikesLandedRed");
const E = document.querySelector(".probabilityOfKnockoutBlue");
const F = document.querySelector(".probabilityOfKnockoutRed");

const q = document.querySelectorAll(".cellQ");
const r = document.querySelectorAll(".cellR");
const i = document.querySelectorAll(".cellI");
const o = document.querySelectorAll(".cellO");
const a = document.querySelector(".numberOfStrikesAttemptedBlueCell");
const b = document.querySelector(".numberOfStrikesAttemptedRedCell");
const c = document.querySelector(".numberOfStrikesLandedBlueCell");
const d = document.querySelector(".numberOfStrikesLandedRedCell");
const e = document.querySelector(".probabilityOfKnockoutBlueCell");
const f = document.querySelector(".probabilityOfKnockoutRedCell");


Q.addEventListener("mouseenter", () => {
q.forEach(cell => {
  cell.style.backgroundColor = "rgba(100, 100, 100, 0.33)";
    });
});

Q.addEventListener("mouseleave", () => {
q.forEach(cell => {
  cell.style.backgroundColor = "";
    });
});

R.addEventListener("mouseenter", () => {
r.forEach(cell => {
  cell.style.backgroundColor = "rgba(100, 100, 100, 0.33)";
    });
});

R.addEventListener("mouseleave", () => {
r.forEach(cell => {
  cell.style.backgroundColor = ""; // Reset to default
    });
});

I.addEventListener("mouseenter", () => {
i.forEach(cell => {
  cell.style.backgroundColor = "rgba(100, 100, 100, 0.33)";
    });
});

I.addEventListener("mouseleave", () => {
i.forEach(cell => {
  cell.style.backgroundColor = ""; // Reset to default
    });
});

O.addEventListener("mouseenter", () => {
o.forEach(cell => {
  cell.style.backgroundColor = "rgba(100, 100, 100, 0.33)";
    });
});

O.addEventListener("mouseleave", () => {
o.forEach(cell => {
  cell.style.backgroundColor = ""; // Reset to default
    });
});

A.addEventListener("mouseenter", () => {
  a.style.backgroundColor = "rgba(100, 100, 100, 0.33)";
});

A.addEventListener("mouseleave", () => {
  a.style.backgroundColor = "";
});

B.addEventListener("mouseenter", () => {
  b.style.backgroundColor = "rgba(100, 100, 100, 0.33)";
});

B.addEventListener("mouseleave", () => {
  b.style.backgroundColor = "";
});

C.addEventListener("mouseenter", () => {
  c.style.backgroundColor = "rgba(100, 100, 100, 0.33)";
});

C.addEventListener("mouseleave", () => {
  c.style.backgroundColor = "";
});

D.addEventListener("mouseenter", () => {
  d.style.backgroundColor = "rgba(100, 100, 100, 0.33)";
});

D.addEventListener("mouseleave", () => {
  d.style.backgroundColor = "";
});

E.addEventListener("mouseenter", () => {
  e.style.backgroundColor = "rgba(100, 100, 100, 0.33)";
});

E.addEventListener("mouseleave", () => {
  e.style.backgroundColor = "";
});

F.addEventListener("mouseenter", () => {
  f.style.backgroundColor = "rgba(100, 100, 100, 0.33)";
});

F.addEventListener("mouseleave", () => {
  f.style.backgroundColor = "";
});
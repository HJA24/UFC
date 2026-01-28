import React from "react";
import ".loader.css";


export default function Loader({
  size = 50,
  border = 2,
  gap = "4%",
  color = "rgba(100, 100, 100, 0.33)",
  background = "white",
}) {
  const style = {
    width: `${size}px`,
    "--b": `${border}px`,
    "--g": gap,
    "--c": color,
    "--bg": background,
  };

  return (
    <div className="loader" style={style}>
      {[...Array(8)].map((_, i) => (
        <i key={i} style={{ "--i": i + 1 }} />
      ))}
    </div>
  );
}

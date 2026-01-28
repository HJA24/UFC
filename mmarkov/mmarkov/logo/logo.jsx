import React from "react";
import "./logo.css";

export default function Loader() {
  return (
    <div className="loader">
      {Array.from({ length: 8 }).map((_, i) => (
        <i key={i}></i>
      ))}
    </div>
  );
}
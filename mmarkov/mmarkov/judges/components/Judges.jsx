import React, { useEffect, useRef, useState } from "react";
import Judge from "./Judge";

function Judges() {
  const [judges, setJudges] = useState([]);
  const formRef = useRef(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/judges.json")
      .then(res => res.json())
      .then(data => {
        const entries = Object.entries(data).map(([id, name]) => ({ id, name }));
        setJudges(entries);
      });
  }, []);

  const submitForm = () => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const body = new URLSearchParams(fd);

    setStatus("Saving...");
    fetch("/submit", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
      .then(res => res.json())
      .then(() => setStatus("Saved"))
      .catch(() => setStatus("Error"));
  };

  const defaults = ["Derek Cleary", "Eric Colon", "Sal d'Amato"];

  return (
    <>
      <form ref={formRef}>
        <div id="judge-selects">
          {[0, 1, 2].map(i => (
            <Judge
              key={i}
              i={i}
              judges={judges}
              defaultName={defaults[i]}
              onChanged={submitForm}
            />
          ))}
        </div>

        <datalist id="allJudges">
          {judges.map(({ id, name }) => (
            <option key={id} value={name} />
          ))}
        </datalist>
      </form>
      <div aria-live="polite">{status}</div>
    </>
  );
}

export default Judges;
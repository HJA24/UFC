import React, { useState, useEffect } from "react";

function Judge({ i, defaultName, judges, onChanged }) {
  const [name, setName] = useState(defaultName || "");
  const [id, setId] = useState("");

  useEffect(() => {
    const match = judges.find(j => j.name === defaultName);
    setId(match ? match.id : "");
  }, [defaultName, judges]);

  useEffect(() => {
    if (onChanged && id) onChanged();
  }, [id, onChanged]);

  const handleChange = (newName) => {
    setName(newName);
    const match = judges.find(j => j.name === newName);
    setId(match ? match.id : "");
  };

  return (
    <div className="judge">
      <label htmlFor={`judge-${i + 1}-name`}>Judge {i + 1}:</label>
      <input
        id={`judge-${i + 1}-name`}
        list="allJudges"
        value={name}
        onChange={e => handleChange(e.target.value)}
      />
      <input type="hidden" name={`judge-${i + 1}`} value={id} />
    </div>
  );
}

export default Judge;

import React from "react";

const Matrix = ({ label, data, className = "" }) => {
  return (
    <div className="formula">
      <span className="variable">\( {label} = \)</span>
      <table className={className}>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, colIdx) => {
                const content = typeof cell === "object" ? cell : { value: cell };

                const { value, tooltip, submatrix } = content;
                const cellClass = submatrix ? `cell${submatrix}` : "";

                return (
                  <td key={colIdx} className={cellClass}>
                    {value}
                    {tooltip && <span className="cellText">{tooltip}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Matrix;

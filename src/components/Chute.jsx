import React from "react";

export default function Chute({ balls }) {
  return (
    <div className="chute">
      {balls.map((n, i) => (
        <div key={i} className="ball">
          {n}
        </div>
      ))}
    </div>
  );
}

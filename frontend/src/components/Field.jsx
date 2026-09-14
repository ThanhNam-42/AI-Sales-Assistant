import React from "react";

// Floating-label text input, used across Login/Register/LeadForm.
export default function Field({
  label,
  type = "text",
  value,
  onChange,
  required,
  error,
  min,
  max,
  step,
  ...rest
}) {
  return (
    <div className={`field${error ? " invalid shake" : ""}`}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder=" "
        min={min}
        max={max}
        step={step}
        {...rest}
      />
      <label>{label}</label>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

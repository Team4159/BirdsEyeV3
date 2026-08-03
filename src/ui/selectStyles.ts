import type { StylesConfig } from "react-select";

interface DropdownOption {
  label: string;
  value: string;
}

export const selectStyles: StylesConfig<DropdownOption, false> = {
  control: (base) => ({
    ...base,
    backgroundColor: "var(--input)",
    borderColor: "var(--border)",
    color: "var(--text)",
    borderRadius: "8px",
    padding: "2px",
    boxShadow: "none",
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: "var(--card)",
    color: "var(--text)",
  }),

  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "var(--button-hover)" : "var(--card)",
    color: "var(--text)",
    cursor: "pointer",
  }),

  singleValue: (base) => ({
    ...base,
    color: "var(--text)",
  }),

  input: (base) => ({
    ...base,
    color: "var(--text)",
  }),

  placeholder: (base) => ({
    ...base,
    color: "var(--text)",
    opacity: 0.6,
  }),
};

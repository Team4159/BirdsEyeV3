export const selectStyles = {
  control: (base: any) => ({
    ...base,
    backgroundColor: "var(--input)",
    borderColor: "var(--border)",
    color: "var(--text)",
    borderRadius: "8px",
    padding: "2px",
    boxShadow: "none",
  }),

  menu: (base: any) => ({
    ...base,
    backgroundColor: "var(--card)",
    color: "var(--text)",
  }),

  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused
      ? "var(--button-hover)"
      : "var(--card)",
    color: "var(--text)",
    cursor: "pointer",
  }),

  singleValue: (base: any) => ({
    ...base,
    color: "var(--text)",
  }),

  input: (base: any) => ({
    ...base,
    color: "var(--text)",
  }),

  placeholder: (base: any) => ({
    ...base,
    color: "var(--text)",
    opacity: 0.6,
  }),
};
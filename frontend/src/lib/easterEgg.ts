// Browser-console breadcrumb for the hidden `:sign` guest-log command — the
// classic dev easter egg. Fires once per page load.
let hinted = false

export function consoleHint(): void {
  if (hinted) return
  hinted = true
  console.log(
    '%c psst %c type %c:sign%c in the terminal to leave a mark in the guest log ',
    'background:#34f08a;color:#02110a;border-radius:2px;padding:0 2px',
    'color:#1c8f4f',
    'color:#c6ffdd;font-weight:bold',
    'color:#1c8f4f',
  )
}

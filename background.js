// background.js — Service worker para el Banco de Respuestas.
// Configura el comportamiento del side panel: abre al hacer click en el icono.

chrome.runtime.onInstalled.addListener(() => {
  // Abre el side panel cuando el user hace click en el icono de la extensión.
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('sidePanel setPanelBehavior error:', error));
});
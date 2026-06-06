(function () {
  if (typeof window === "undefined") return;

  var reloadKey = "tt-dev-chunk-auto-reload";

  function isChunkFailure(message) {
    var m = String(message || "").toLowerCase();
    return (
      m.indexOf("chunkloaderror") >= 0 ||
      m.indexOf("loading chunk") >= 0 ||
      m.indexOf("failed to fetch dynamically imported module") >= 0 ||
      m.indexOf("err_connection_reset") >= 0 ||
      m.indexOf("connection reset") >= 0 ||
      m.indexOf("invalid or unexpected token") >= 0 ||
      (m.indexOf("_next/static") >= 0 && (m.indexOf("404") >= 0 || m.indexOf("failed") >= 0))
    );
  }

  function tryReload(message) {
    if (!isChunkFailure(message)) return;
    try {
      if (sessionStorage.getItem(reloadKey) === "1") return;
      sessionStorage.setItem(reloadKey, "1");
      window.location.reload();
    } catch (e) {}
  }

  window.addEventListener("error", function (event) {
    tryReload(event && event.message);
  });
  window.addEventListener("unhandledrejection", function (event) {
    var reason = event && event.reason;
    var msg =
      reason && reason.message
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "";
    tryReload(msg);
  });

  window.setTimeout(function () {
    try {
      sessionStorage.removeItem(reloadKey);
    } catch (e) {}
  }, 8000);
})();

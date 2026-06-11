(function () {

  try {

    var uidKey = "traveltrust_user_id";

    var tokKey = "traveltrust_session_token";

    var okKey = "traveltrust_session_ok";

    var u = localStorage.getItem(uidKey);

    var t = localStorage.getItem(tokKey);

    if (!u || !t) return;

    var uidPrefix = uidKey + "=";

    var okPrefix = okKey + "=";

    var hasUid = document.cookie.split(";").some(function (c) {

      return c.trim().indexOf(uidPrefix) === 0;

    });

    var hasOk = document.cookie.split(";").some(function (c) {

      return c.trim().indexOf(okPrefix) === 0;

    });

    if (hasUid && hasOk) return;

    document.cookie = uidPrefix + encodeURIComponent(String(u).trim()) + "; Path=/; SameSite=Lax";

    document.cookie = okPrefix + "1; Path=/; Max-Age=28800; SameSite=Lax";

  } catch (e) {}

})();


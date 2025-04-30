function generateUrl() {
    let baseUrl = document.getElementById("baseUrl").value.trim();
    const guestName = document.getElementById("guestName").value.trim();
    const errorMessage = document.getElementById("errorMessage");
    const copyMessage = document.getElementById("copyMessage");
    errorMessage.textContent = "";
    copyMessage.textContent = "";
    if (!guestName) {
      errorMessage.textContent = "Isi nama tamunya dulu ya";
      return;
    }
    if (!baseUrl.endsWith("/")) {
      baseUrl += "/";
    }
    const encodedName = encodeURIComponent(guestName);
    const finalUrl = `${baseUrl}?to=${encodedName}`;
    document.getElementById("generatedUrl").value = finalUrl;
    document.getElementById("resultContainer").style.display = "flex";
  }

  function copyUrl() {
    const urlField = document.getElementById("generatedUrl");
    urlField.select();
    urlField.setSelectionRange(0, 99999);
    document.execCommand("copy");
    document.getElementById("copyMessage").textContent = "URL udah dicopy ke clipboard!";
  }
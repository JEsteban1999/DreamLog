self.addEventListener("push", (event) => {
  let data = { title: "DreamLog", body: "Tienes una notificación nueva." };
  try {
    data = event.data.json();
  } catch {
    // payload no era JSON, usamos el default
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.svg",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow("/");
    })
  );
});

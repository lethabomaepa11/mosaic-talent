self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Mosaic Talent", body: event.data.text() };
  }

  const title =
    typeof data.title === "string" && data.title.trim().length > 0
      ? data.title
      : "Mosaic Talent";

  const options = {
    body: typeof data.body === "string" ? data.body : "",
    icon: typeof data.icon === "string" ? data.icon : "/logo.svg",
    badge: typeof data.badge === "string" ? data.badge : "/logo.svg",
    data: {
      url: typeof data.url === "string" ? data.url : "/app",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification &&
    event.notification.data &&
    typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/app";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          if (targetUrl && "navigate" in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return Promise.resolve();
    }),
  );
});

import { Controller } from "@core";

export default class WelcomeGet extends Controller {
  protected async handle(): Promise<Response> {
    return this.render("home", {
      title: "Welcome",
      features: [
        "File-based routing",
        "Laravel-style CLI",
        "WebSocket & SSE support",
        "Handlebars templating",
        "Static file serving",
        "Config management",
      ],
    });
  }
}

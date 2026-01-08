import { Controller } from "@yoeast/core";

export default class HintsTestController extends Controller {
  async handle() {
    // Add some hints
    this.preload("/css/test.css", "style");
    this.preconnect("https://api.test.com");
    this.prefetch("/next-page.html");
    
    return this.json({ ok: true });
  }
}

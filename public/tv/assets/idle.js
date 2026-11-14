/* Mowj TV — idle trigger: calls fire() once after `delay` ms without arm()
 * being called again, but only if eligible() still holds at that moment.
 * Plain ES5, like the rest of the app; kept separate so it can be tested
 * with fake timers. */
(function (root) {
  "use strict";

  function createIdleTrigger(options) {
    var delay = options.delay;
    var eligible = options.eligible;
    var fire = options.fire;
    var setTimer = options.setTimeout || function (fn, ms) {
      return root.setTimeout(fn, ms);
    };
    var clearTimer = options.clearTimeout || function (id) {
      root.clearTimeout(id);
    };
    var timer = null;

    function cancel() {
      if (timer !== null) {
        clearTimer(timer);
        timer = null;
      }
    }

    // Start a fresh idle period (every user input, focus change or new playback).
    function arm() {
      cancel();
      if (!eligible()) return;
      timer = setTimer(function () {
        timer = null;
        if (eligible()) fire();
      }, delay);
    }

    return {
      arm: arm,
      cancel: cancel,
      pending: function () {
        return timer !== null;
      },
    };
  }

  root.MowjIdle = createIdleTrigger;
})(typeof window !== "undefined" ? window : this);

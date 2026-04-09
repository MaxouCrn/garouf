/**
 * Day narrator sound libraries.
 *
 * Expo requires static require() calls — you cannot dynamically scan a folder.
 * To add a new announcement, just add a require() line to the right array below.
 */

export const ANNONCE_DEATH = [
  require("./death/annonce-death-1.mp3"),
  require("./death/annonce-death-2.mp3"),
];

export const ANNONCE_NO_DEATH = [
  require("./no-death/annonce-no-death-1.mp3"),
  require("./no-death/annonce-no-death-2.mp3"),
  require("./no-death/annonce-no-death-3.mp3"),
];

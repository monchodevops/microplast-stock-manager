/**
 * Vitest / Angular testing bootstrap.
 * Imported via vite.config.ts > test.setupFiles.
 *
 * zone.js MUST be imported first — Angular TestBed requires it.
 */
import 'zone.js';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';

getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
  { teardown: { destroyAfterEach: true } }
);

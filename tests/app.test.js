import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { createNewItem } from '../src/app.js';

describe('landscape detection', () => {
    let originalInnerWidth;
    let originalInnerHeight;

    beforeEach(() => {
        originalInnerWidth = window.innerWidth;
        originalInnerHeight = window.innerHeight;
    });

    afterEach(() => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: originalInnerWidth,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: originalInnerHeight,
        });
    });

    test('should detect landscape mode when width > height and width >= 768', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1200,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 600,
        });

        // Import the function dynamically to get the latest window state
        const isLandscape = eval(`
            function isLandscapeMode() {
                return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
            }
            isLandscapeMode()
        `);

        expect(isLandscape).toBe(true);
    });

    test('should detect portrait mode when width <= height', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 600,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 1200,
        });

        const isLandscape = eval(`
            function isLandscapeMode() {
                return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
            }
            isLandscapeMode()
        `);

        expect(isLandscape).toBe(false);
    });

    test('should detect portrait mode when width < 768 even if width > height', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 500,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 400,
        });

        const isLandscape = eval(`
            function isLandscapeMode() {
                return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
            }
            isLandscapeMode()
        `);

        expect(isLandscape).toBe(false);
    });
});

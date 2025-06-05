"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.kognityService = void 0;
const puppeteer = __importStar(require("puppeteer"));
const config_1 = require("../config");
/**
 * KognityService provides access to Kognity content through web scraping
 * using Puppeteer to automate browser interactions
 */
class KognityService {
    constructor() {
        this.browser = null;
        this.isLoggedIn = false;
        this.sessionExpiry = null;
    }
    /**
     * Initialize the browser
     */
    async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true, // Use boolean mode for compatibility
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
        }
        return this.browser;
    }
    /**
     * Login to Kognity
     */
    async login() {
        // Check if already logged in and session is still valid
        if (this.isLoggedIn && this.sessionExpiry && this.sessionExpiry > new Date()) {
            return;
        }
        try {
            const browser = await this.initBrowser();
            const page = await browser.newPage();
            // Navigate to Kognity login page
            await page.goto('https://app.kognity.com/sign-in/', { waitUntil: 'networkidle2' });
            // Fill in the login form
            await page.type('#email', config_1.config.KOGNITY_USERNAME);
            await page.type('#password', config_1.config.KOGNITY_PASSWORD);
            // Click the login button and wait for navigation
            await Promise.all([
                page.click('button[type="submit"]'),
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
            ]);
            // Check if login was successful
            const url = page.url();
            if (url.includes('app.kognity.com/study')) {
                this.isLoggedIn = true;
                // Set session expiry (2 hours)
                const expiryTime = new Date();
                expiryTime.setHours(expiryTime.getHours() + 2);
                this.sessionExpiry = expiryTime;
                console.log('Successfully logged in to Kognity');
            }
            else {
                throw new Error('Failed to login to Kognity');
            }
            await page.close();
        }
        catch (error) {
            console.error('Kognity login failed:', error);
            throw new Error('Failed to login to Kognity');
        }
    }
    /**
     * Get physics course topics
     */
    async getPhysicsTopics() {
        try {
            await this.login();
            const browser = await this.initBrowser();
            const page = await browser.newPage();
            // Navigate to the Physics course page
            await page.goto('https://app.kognity.com/study/app/physics-hl-2', { waitUntil: 'networkidle2' });
            // Extract topics and subtopics
            const topics = await page.evaluate(() => {
                const topicElements = Array.from(document.querySelectorAll('.subject-nav-item'));
                return topicElements.map(topicEl => {
                    var _a;
                    const titleEl = topicEl.querySelector('.item-name');
                    const title = titleEl ? ((_a = titleEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '' : '';
                    const id = topicEl.getAttribute('data-id') || '';
                    // Get subtopics for this topic
                    const subtopicElements = Array.from(topicEl.querySelectorAll('.subtopic-item'));
                    const subtopics = subtopicElements.map(subtopicEl => {
                        var _a;
                        const subtopicTitle = ((_a = subtopicEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                        const subtopicId = subtopicEl.getAttribute('data-id') || '';
                        const url = subtopicEl.getAttribute('href') || '';
                        return {
                            id: subtopicId,
                            title: subtopicTitle,
                            url: url
                        };
                    });
                    return {
                        id,
                        title,
                        subtopics
                    };
                });
            });
            await page.close();
            return topics;
        }
        catch (error) {
            console.error('Failed to fetch physics topics:', error);
            throw new Error('Failed to fetch physics topics from Kognity');
        }
    }
    /**
     * Get content for a specific subtopic
     */
    async getSubtopicContent(subtopicUrl) {
        try {
            await this.login();
            const browser = await this.initBrowser();
            const page = await browser.newPage();
            // Navigate to the subtopic page
            await page.goto(`https://app.kognity.com${subtopicUrl}`, { waitUntil: 'networkidle2' });
            // Extract content
            const content = await page.evaluate(() => {
                var _a;
                const titleEl = document.querySelector('h1');
                const title = titleEl ? ((_a = titleEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '' : '';
                const contentDivs = Array.from(document.querySelectorAll('.book-content p, .book-content h2, .book-content h3, .book-content li'));
                const textContent = contentDivs
                    .map(div => { var _a; return (_a = div.textContent) === null || _a === void 0 ? void 0 : _a.trim(); })
                    .filter(text => text && text.length > 0)
                    .join('\n\n');
                // Extract image URLs
                const imageElements = Array.from(document.querySelectorAll('.book-content img'));
                const images = imageElements
                    .map(img => img.getAttribute('src'))
                    .filter(Boolean);
                return {
                    id: window.location.pathname,
                    title,
                    content: textContent,
                    images
                };
            });
            await page.close();
            return content;
        }
        catch (error) {
            console.error(`Failed to fetch subtopic content:`, error);
            throw new Error('Failed to fetch subtopic content from Kognity');
        }
    }
    /**
     * Search physics content
     */
    async searchPhysicsContent(query) {
        try {
            await this.login();
            const browser = await this.initBrowser();
            const page = await browser.newPage();
            // Navigate to the search page
            await page.goto(`https://app.kognity.com/search/?query=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2' });
            // Extract search results
            const results = await page.evaluate(() => {
                const resultElements = Array.from(document.querySelectorAll('.search-result-item'));
                return resultElements.map(resultEl => {
                    var _a, _b;
                    const titleEl = resultEl.querySelector('.result-title');
                    const title = titleEl ? ((_a = titleEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '' : '';
                    const id = resultEl.getAttribute('data-id') || '';
                    const url = resultEl.getAttribute('href') || '';
                    const excerptEl = resultEl.querySelector('.result-excerpt');
                    const content = excerptEl ? ((_b = excerptEl.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '' : '';
                    return {
                        id,
                        title,
                        url,
                        content
                    };
                });
            });
            await page.close();
            // Return the first 5 results
            return results.slice(0, 5);
        }
        catch (error) {
            console.error(`Failed to search for "${query}":`, error);
            throw new Error('Failed to search Kognity content');
        }
    }
    /**
     * Close the browser and cleanup
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.isLoggedIn = false;
            this.sessionExpiry = null;
        }
    }
}
exports.kognityService = new KognityService();

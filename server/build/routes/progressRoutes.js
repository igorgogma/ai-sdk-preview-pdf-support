"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const progressController_1 = require("../controllers/progressController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Progress endpoints
router.get('/', progressController_1.getUserProgress);
router.post('/update', progressController_1.updateProgress);
router.get('/summary', progressController_1.getTopicSummary);
exports.default = router;

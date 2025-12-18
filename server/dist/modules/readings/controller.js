"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroy = exports.update = exports.create = exports.show = exports.index = void 0;
const service_1 = require("./service");
const index = async (req, res, next) => {
    try {
        const userId = Number(req.userId);
        const items = await (0, service_1.listReadings)(userId);
        res.status(200).json(items);
    }
    catch (err) {
        next(err);
    }
};
exports.index = index;
const show = async (req, res, next) => {
    try {
        const userId = Number(req.userId);
        const item = await (0, service_1.getReading)(userId, req.params.id);
        res.status(200).json(item);
    }
    catch (err) {
        next(err);
    }
};
exports.show = show;
const create = async (req, res, next) => {
    try {
        const userId = Number(req.userId);
        const item = await (0, service_1.createReading)(userId, req.body);
        res.status(201).json(item);
    }
    catch (err) {
        next(err);
    }
};
exports.create = create;
const update = async (req, res, next) => {
    try {
        const userId = Number(req.userId);
        const item = await (0, service_1.updateReading)(userId, req.params.id, req.body);
        res.status(200).json(item);
    }
    catch (err) {
        next(err);
    }
};
exports.update = update;
const destroy = async (req, res, next) => {
    try {
        const userId = Number(req.userId);
        const result = await (0, service_1.deleteReading)(userId, req.params.id);
        res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
};
exports.destroy = destroy;

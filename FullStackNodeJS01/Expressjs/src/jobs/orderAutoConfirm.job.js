const { autoConfirmPendingOrdersService } = require('../services/order.service');

const AUTO_CONFIRM_INTERVAL_MS = 5 * 60 * 1000;

let jobHandle = null;
let jobRunning = false;

const runAutoConfirmJob = async () => {
    if (jobRunning) {
        return;
    }

    jobRunning = true;

    try {
        await autoConfirmPendingOrdersService();
    } catch (error) {
        console.error('>>> Auto confirm order job failed:', error);
    } finally {
        jobRunning = false;
    }
};

const startOrderAutoConfirmJob = () => {
    if (process.env.VERCEL || jobHandle) {
        return null;
    }

    void runAutoConfirmJob();
    jobHandle = setInterval(() => {
        void runAutoConfirmJob();
    }, AUTO_CONFIRM_INTERVAL_MS);

    return jobHandle;
};

const stopOrderAutoConfirmJob = () => {
    if (jobHandle) {
        clearInterval(jobHandle);
        jobHandle = null;
    }
};

module.exports = {
    startOrderAutoConfirmJob,
    stopOrderAutoConfirmJob,
};
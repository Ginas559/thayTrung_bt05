require('dotenv').config();
const connection = require('../config/database');
const Keyboard = require('../models/keyboard');
const Category = require('../models/category');

const argv = process.argv.slice(2);
const targetCount = Number(argv[0] || process.env.SEED_TARGET || 200);

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const buildClone = (base, idx) => {
    const clone = { ...base };
    // remove _id if present and tweak some fields
    delete clone._id;
    clone.title = `${base.title} - Test ${idx}`;
    clone.slug = `${base.slug || 'keyboard'}-test-${Date.now()}-${idx}`;
    clone.sold = (base.sold || 0) + randomBetween(0, 50);
    clone.viewCount = (base.viewCount || 0) + randomBetween(0, 200);
    clone.price = base.price ? Math.max(10000, base.price + randomBetween(-50000, 50000)) : randomBetween(200000, 3000000);
    clone.reviewCount = (base.reviewCount || 0) + randomBetween(0, 20);
    clone.rating = +(Math.min(5, Math.max(1, (base.rating || 4) + (Math.random() - 0.5))).toFixed(1));
    clone.createdAtLabel = new Date().toISOString().slice(0,10);
    return clone;
};

const seedMany = async (target) => {
    await connection();

    const current = await Keyboard.countDocuments();
    console.log(`Current keyboard count: ${current}`);
    if (current >= target) {
        console.log(`No action needed. Current(${current}) >= target(${target}).`);
        process.exit(0);
    }

    const need = target - current;
    console.log(`Need to insert ${need} more keyboards to reach ${target}`);

    const samples = await Keyboard.find({}).limit(50).lean();
    if (!samples.length) {
        console.error('No existing keyboards found. Run initial seed or create sample keyboards first.');
        process.exit(1);
    }

    const batchSize = 100;
    const toInsert = [];
    for (let i = 0; i < need; i++) {
        const base = samples[i % samples.length];
        toInsert.push(buildClone(base, i + 1));
        if (toInsert.length >= batchSize) {
            await Keyboard.insertMany(toInsert.splice(0, toInsert.length));
            console.log(`Inserted ${batchSize}...`);
        }
    }

    if (toInsert.length) {
        await Keyboard.insertMany(toInsert);
        console.log(`Inserted final ${toInsert.length}`);
    }

    const finalCount = await Keyboard.countDocuments();
    console.log(`Seeding complete. Final keyboard count: ${finalCount}`);
    process.exit(0);
};

seedMany(targetCount).catch((err) => {
    console.error('Seeder error:', err);
    process.exit(1);
});

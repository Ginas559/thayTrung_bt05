require('dotenv').config();
const mongoose = require('mongoose');

const resolveMongoUri = () => {
    return process.env.MONGO_DB_URL
        || process.env.MONGODB_URI
        || (!process.env.VERCEL ? 'mongodb://localhost:27017/fullstack02' : undefined);
};

const dbState = [{
    value: 0,
    label: "Disconnected"
},
{
    value: 1,
    label: "Connected"
},
{
    value: 2,
    label: "Connecting"
},
{
    value: 3,
    label: "Disconnecting"
}];

const connection = async () => {
    const mongoUri = resolveMongoUri();

    if (!mongoUri) {
        throw new Error('MongoDB connection string is missing. Set MONGO_DB_URL or MONGODB_URI.');
    }

    await mongoose.connect(mongoUri);
    const state = Number(mongoose.connection.readyState);
    console.log(dbState.find(f => f.value === state).label, "to database");
}

module.exports = connection;